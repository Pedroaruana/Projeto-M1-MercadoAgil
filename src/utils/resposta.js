// Formato de resposta do serviço. Todo método público do Marketplace devolve um destes.
export const sucesso = (dados) => ({ ok: true, dados })

export const falha = (...erros) => ({ ok: false, erros: erros.flat() })
