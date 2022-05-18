export interface User {
  isvalid: boolean,
  token: string,
  canchange: boolean,
  candelete: boolean,
  canadd: boolean,
  cantk: boolean,
  cantkmeta: boolean,
  cantkcate: boolean,
  cantkname: boolean,
  canapprove: boolean,
  cansearch: boolean,
  ismanager: boolean,
  isadmin: boolean,
  name: string,
  isnew: boolean,
  timeout: number
}
