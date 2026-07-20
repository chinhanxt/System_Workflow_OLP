from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class Workflow(BaseModel):
    """Workflow model defining node and edge configurations."""

    name = models.CharField(_("name"), max_length=255)
    description = models.TextField(_("description"), blank=True)
    is_active = models.BooleanField(_("is active"), default=True)
    nodes = models.JSONField(_("nodes"), default=dict, blank=True)
    edges = models.JSONField(_("edges"), default=list, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "workflows"
        verbose_name = _("Workflow")
        verbose_name_plural = _("Workflows")

    def __str__(self):
        return self.name


class WorkflowRun(BaseModel):
    """WorkflowRun model tracking workflow execution instance status and state."""

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        RUNNING = "running", _("Running")
        SUCCESS = "success", _("Success")
        FAILED = "failed", _("Failed")
        PENDING_APPROVAL = "pending_approval", _("Pending Approval")

    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="runs",
        verbose_name=_("workflow"),
    )
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    state_data = models.JSONField(_("state data"), default=dict, blank=True)
    started_at = models.DateTimeField(_("started at"), null=True, blank=True)
    finished_at = models.DateTimeField(_("finished at"), null=True, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "workflow_runs"
        verbose_name = _("Workflow Run")
        verbose_name_plural = _("Workflow Runs")

    def __str__(self):
        return f"{self.workflow.name} - {self.status} ({self.id})"


class NodeRunLog(BaseModel):
    """NodeRunLog model recording individual node execution log in a run."""

    class Status(models.TextChoices):
        RUNNING = "running", _("Running")
        SUCCESS = "success", _("Success")
        FAILED = "failed", _("Failed")

    workflow_run = models.ForeignKey(
        WorkflowRun,
        on_delete=models.CASCADE,
        related_name="node_logs",
        verbose_name=_("workflow run"),
    )
    node_id = models.CharField(_("node id"), max_length=100)
    node_type = models.CharField(_("node type"), max_length=100)
    status = models.CharField(
        _("status"),
        max_length=20,
        choices=Status.choices,
        default=Status.RUNNING,
    )
    input_data = models.JSONField(_("input data"), default=dict, blank=True)
    output_data = models.JSONField(
        _("output data"), default=dict, blank=True, null=True
    )
    error_message = models.TextField(_("error message"), blank=True, default="")
    started_at = models.DateTimeField(
        _("started at"), default=timezone.now, null=True, blank=True
    )
    finished_at = models.DateTimeField(_("finished at"), null=True, blank=True)

    class Meta(BaseModel.Meta):
        db_table = "node_run_logs"
        verbose_name = _("Node Run Log")
        verbose_name_plural = _("Node Run Logs")

    def __str__(self):
        return f"{self.node_id} ({self.node_type}) - {self.status}"
