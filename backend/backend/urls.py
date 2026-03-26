from django.contrib import admin
from django.urls import path
from chat import views
urlpatterns = [
    path('admin/', admin.site.urls),
    path('audio/',views.interface_audio),
    path('med/',views.interface_med),
    path('records/',views.fetch_records),
    path('inventory/', views.manage_inventory, name='inventory'),
    path('tasks/', views.fetch_tasks, name='tasks'),

]
