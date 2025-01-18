export interface IUserSendMail {
  userName: string;
  userEmail: string;
  userPassword: string;
  userRole: string;
}

export interface IUserSendMailOtp {
  userEmail: string;
  userOTP: string;
}
