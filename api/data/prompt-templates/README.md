# Prompt Templates Directory

Este diretório armazena os templates de prompts personalizados criados pelos usuários.

## Estrutura

- Cada template é salvo como um arquivo JSON individual
- O nome do arquivo corresponde ao ID único do template
- Templates padrão são carregados diretamente no código

## Formato do Template

```json
{
  "id": "uuid-do-template",
  "name": "Nome do Template",
  "description": "Descrição do que o template faz",
  "system": "Prompt do sistema",
  "user": "Prompt do usuário com {variáveis}",
  "variables": ["lista", "de", "variáveis"],
  "category": "categoria",
  "nrFocus": "NR-específica ou general",
  "createdBy": "userId",
  "createdAt": "timestamp",
  "usage": 0,
  "rating": 0,
  "reviews": []
}
```

## Categorias Disponíveis

- safety_committee
- personal_protection
- electrical_safety
- machine_safety
- height_safety
- emergency_procedures
- risk_assessment
- practical_training
- compliance
- custom