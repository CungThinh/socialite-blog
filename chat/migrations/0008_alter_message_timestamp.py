# Generated by Django 5.0.3 on 2024-09-01 17:00

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0007_alter_room_unique_together_alter_message_timestamp'),
    ]

    operations = [
        migrations.AlterField(
            model_name='message',
            name='timestamp',
            field=models.DateTimeField(default=datetime.datetime(2024, 9, 1, 17, 0, 47, 105968, tzinfo=datetime.timezone.utc)),
        ),
    ]
