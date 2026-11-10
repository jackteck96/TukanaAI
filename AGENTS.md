# Agent rules

- Public Terms of Service text lives in src/content/legal/termsOfService.ts (EN original + PT-BR translation), chosen by i18n language; the terms_of_service DB table only backs signup consent/admin versioning — why: the table has no locale columns.
- Platform-admin invitations authorize via user_roles/is_platform_admin and bind invited_by to auth.uid(), never via profiles.role or company membership — why: platform administrators may also belong to a company.
