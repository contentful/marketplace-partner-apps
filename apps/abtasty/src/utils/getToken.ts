export const getToken = () => localStorage.getItem('abtasty_token');

export const updateToken = (token: string) => localStorage.setItem('abtasty_token', token);