// Fusos IANA comuns do Brasil (HU 11.4). O backend valida qualquer IANA
// válido — esta lista é só o que aparece no select, não uma restrição.
export const BR_TIMEZONES: { value: string; label: string }[] = [
  { value: 'America/Noronha', label: 'Fernando de Noronha (UTC-02:00)' },
  { value: 'America/Belem', label: 'Belém (UTC-03:00)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (UTC-03:00)' },
  { value: 'America/Recife', label: 'Recife (UTC-03:00)' },
  { value: 'America/Bahia', label: 'Salvador (UTC-03:00)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo, Brasília (UTC-03:00)' },
  { value: 'America/Araguaina', label: 'Araguaína (UTC-03:00)' },
  { value: 'America/Cuiaba', label: 'Cuiabá (UTC-04:00)' },
  { value: 'America/Campo_Grande', label: 'Campo Grande (UTC-04:00)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (UTC-04:00)' },
  { value: 'America/Boa_Vista', label: 'Boa Vista (UTC-04:00)' },
  { value: 'America/Manaus', label: 'Manaus (UTC-04:00)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (UTC-05:00)' },
]
