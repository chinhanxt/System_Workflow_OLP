from rest_framework import serializers

from apps.workflows.models import Workflow, WorkflowRun


class WorkflowSerializer(serializers.ModelSerializer):
    """Serializer for Workflow model."""

    class Meta:
        model = Workflow
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "nodes",
            "edges",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class WorkflowRunSerializer(serializers.ModelSerializer):
    """Serializer for WorkflowRun model."""

    class Meta:
        model = WorkflowRun
        fields = [
            "id",
            "workflow",
            "status",
            "state_data",
            "started_at",
            "finished_at",
        ]
        read_only_fields = ["id", "started_at", "finished_at"]
