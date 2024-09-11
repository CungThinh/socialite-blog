# Generated by Django 5.0.3 on 2024-05-15 12:10

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0006_alter_message_timestamp'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='room',
            unique_together=set(),
        ),
        migrations.AlterField(
            model_name='message',
            name='timestamp',
            field=models.DateTimeField(default=datetime.datetime(2024, 5, 15, 12, 10, 44, 176766, tzinfo=datetime.timezone.utc)),
        ),
    ]
