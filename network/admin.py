from django.contrib import admin
from .models import Post, User
# Register your models here.
# class AuctionAdmin(admin.ModelAdmin):
#     list_display = ("id","title", "description", "starting_bid", "category", "seller", "price")

# class AuctionAdmin(admin.ModelAdmin):
#     filter_horizontal = ('watchers',)

# class UserAdmin(admin.ModelAdmin):
#     list_display = ("username","password", "first", "last")

# admin.site.register(Auction, AuctionAdmin)
admin.site.register(Post)
admin.site.register(User)
