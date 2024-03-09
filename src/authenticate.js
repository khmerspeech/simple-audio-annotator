export const createHeaders = (values = {}) => {
  const token = localStorage.getItem("saa:token")
  if (typeof token === 'string' && token.length !== 0) {
    return {
      ...values,
      "Authorization": `Bearer ${token}`,
    }
  }
  return { ...values };
}