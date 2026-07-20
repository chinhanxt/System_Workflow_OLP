from django.urls import include
from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.api.views import AuthViewSet
from apps.users.api.views import UserViewSet
from apps.workflows.api.views import DocumentChunkViewSet
from apps.workflows.api.views import WorkflowRunViewSet
from apps.workflows.api.views import WorkflowViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("workflows", WorkflowViewSet, basename="workflow")
router.register("workflow-runs", WorkflowRunViewSet, basename="workflowrun")
router.register("document-chunks", DocumentChunkViewSet, basename="documentchunk")

auth_urlpatterns = [
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", AuthViewSet.as_view({"get": "me"}), name="auth_me"),
    path(
        "change-password/",
        AuthViewSet.as_view({"post": "change_password"}),
        name="auth_change_password",
    ),
]

app_name = "api"

urlpatterns = [
    path("v1/auth/", include((auth_urlpatterns, "auth"))),
    path("v1/", include(router.urls)),
]
