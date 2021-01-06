from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    first = models.CharField(max_length=255, null=True)
    followers = models.ManyToManyField('User', related_name="following", null=True)

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts", null=True)
    body = models.TextField(blank=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    liked_users = models.ManyToManyField(User, related_name="liked_posts", null=True)
    # user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="emails")
    # sender = models.ForeignKey("User", on_delete=models.PROTECT, related_name="emails_sent")
    # recipients = models.ManyToManyField("User", related_name="emails_received")
    # subject = models.CharField(max_length=255)
    # body = models.TextField(blank=True)
    # timestamp = models.DateTimeField(auto_now_add=True)
    # read = models.BooleanField(default=False)
    # archived = models.BooleanField(default=False)

    def serialize(self, liked, owner):
        return {
            "id": self.id,
            "user": self.user.username,
            "user_id": self.user.id,
            "body": self.body,
            # "timestamp": self.timestamp.strftime("%A, %B %d %Y, %I:%M%p"),
            "timestamp": self.timestamp.isoformat(),
            "liked_users": [user.id for user in self.liked_users.all()],
            "likes": self.liked_users.count(),
            "liked": liked,
            "owner": owner
        }

    def __str__(self):
        return f"By: {self.user} Post: {self.body}"