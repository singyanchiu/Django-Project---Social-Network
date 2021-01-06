from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django import forms
from .models import User, Post
from django.forms import ModelForm
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json
import re
from django.core.paginator import Paginator

# class PostForm(ModelForm):
#     class Meta:
#         model = Post
#         fields = ['body']
#         widgets = {
#             # 'body': forms.TextInput(attrs={'placeholder': 'Write your post here...', 'label': ""})
#             'body': forms.Textarea(attrs={'placeholder': 'Write your post here...', 'cols': 80, 'rows': 7}),
#         }

def posts(request, action):
    # Filter emails returned based on mailbox
    if action == "all":
        posts = Post.objects.all()
    elif action == 'following':
        followings = request.user.following.all()
        posts = Post.objects.filter(user__in=followings)
    else:
        id = int(action)
        posts = Post.objects.filter(user=User.objects.get(pk=id))
    posts = posts.order_by("-timestamp").all()
    liked_status = []
    owner_status = []
    for post in posts:
        # print(post.liked_users.all())
        if request.user in post.liked_users.all():
            # print(f'\n\nLiked User: {request.user}\n\n')
            liked_status.append(1)
        else:
            liked_status.append(0)

        if request.user == post.user:
            print(f'\n\nOwner: {request.user}\n\n')
            owner_status.append(1)
        else:
            owner_status.append(0)

    posts_response = [post.serialize(status, owner) for post, status, owner in zip(posts, liked_status, owner_status)]
    #Pagination
    paginator = Paginator(posts_response, 5)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    page = paginator.page(page_number)
    return JsonResponse([{
        'num_pages' : paginator.num_pages,
        'has_next' : page.has_next(),
        'has_previous' : page.has_previous(),
        'has_other_pages' : page.has_other_pages(),
        'next_page_number' : page.next_page_number() if page.has_next() else None,
        'previous_page_number' : page.previous_page_number() if page.has_previous() else None
        }] + list(page_obj), safe=False)

def index(request):
    return render(request, "network/index.html")

@login_required
def like_post(request, action, id):
    # Update post or create new post
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not logged in."}, status=400)

    if request.method == "PUT":
        data = json.loads(request.body)
        id = data.get('id')
        post = Post.objects.get(pk=id)
        if action=='like':
            post.liked_users.add(request.user)
            print(f'\nLiked Post.\n')
        else:
            post.liked_users.remove(request.user)
            print(f'\nUnliked Post.\n')
        post.save()
        return JsonResponse({"message": f"Post {action}d successfully."}, status=201)
    else:
        return JsonResponse({"error": "Something went wrong leh."}, status=400)


# @login_required
def create_post(request):
    if not request.user.is_authenticated:
        return HttpResponse("Please log in.")

    print(f'\nIn create post function.\n')
    # Update or create new post must be via a POST or PUT request
    if request.method != "POST" and request.method != "PUT" :
        return JsonResponse({"error": "POST or PUT request required."}, status=400)

    # Update post or create new post
    if request.method == "PUT":
        data = json.loads(request.body)
        if data.get('body') == "":
            return JsonResponse({
                "error": "Empty message."
            }, status=400)
        id = data.get('id')
        body = data.get('body')
        post = Post.objects.get(pk=id)
        post.body = body
        post.save()
        print(f'\nUpdated Post.\n')
        return JsonResponse({"message": "Post updated successfully."}, status=201)
    else:
        data = json.loads(request.body)
        if data.get('body') == "":
            return JsonResponse({
                "error": "Empty message."
            }, status=400)

        body = data.get('body')
        post = Post(user=request.user, body=body)
        post.save()
        print(f'\nSaved Post.\n')
        return JsonResponse({"message": "Post created successfully."}, status=201)

def user_view(request, id):
    try:
        user = User.objects.get(pk=id)
    except User.DoesNotExist:
        return JsonResponse({
            "error": f"User with id {id} does not exist."
        }, status=400)

    if request.user.is_authenticated and request.method == 'PUT':
        data = json.loads(request.body)
        if data.get('action') == 'follow':
            user.followers.add(request.user)
        elif data.get('action') == 'unfollow':
            user.followers.remove(request.user)
        user.save()
        return JsonResponse({"message": "Update successful."}, status=201)

    followers_count = user.followers.count()
    following_count = user.following.count()
    if request.user.is_authenticated:
        #own profile
        if user == request.user:
            status = 'own'
        #The profile of a following
        elif user in request.user.following.all():
            status = 'following'
        #non-following profile
        else:
            status = 'other'
    else:
        status = 'not_logged_in'
    print(f'\nFollowers count: {followers_count}')
    print(f'Status: {status}\n')
    return JsonResponse({
        "user": user.username,
        "followers_count": followers_count,
        "following_count": following_count,
        "status": status
        }, status=200)

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
