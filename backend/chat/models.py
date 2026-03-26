from django.db import models
from django.utils import timezone

class MedicalRecord(models.Model):
    created_at = models.DateTimeField(default=timezone.now)
    raw_input = models.TextField()
    ai_response = models.JSONField(default=dict) 
    patient_summary = models.TextField(blank=True, null=True)
    chief_complaint = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"SOAP Note - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

class SBARReport(models.Model):
    created_at = models.DateTimeField(default=timezone.now)
    transcription = models.TextField()
    ai_response = models.JSONField(default=dict)
    patient_name = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"SBAR - {self.patient_name or 'Unknown'} - {self.created_at.strftime('%Y-%m-%d')}"