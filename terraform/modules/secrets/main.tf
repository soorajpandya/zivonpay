resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.project_name}-${var.environment}-secrets"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = {
    Name = "${var.project_name}-${var.environment}-secrets"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id

  secret_string = jsonencode({
    db_password         = var.db_password
    sprintnxt_client_id = var.sprintnxt_client_id
    sprintnxt_token     = var.sprintnxt_token
    encryption_key      = var.encryption_key
  })
}
