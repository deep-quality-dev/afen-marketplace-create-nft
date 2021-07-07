import { NotificationDataStatusEnum } from "../components/Notification";

export const messages = {
  walletNetworkError: {
    status: NotificationDataStatusEnum.ERROR,
    title: "Wrong Network",
    text: "Please change network",
  },
  networkError: {
    status: NotificationDataStatusEnum.ERROR,
    title: "Network Error",
    text: "Please check your connection",
  },
  walletConnectionError: {
    status: NotificationDataStatusEnum.ERROR,
    title: "Connect MetaMask",
    text: "Please install MetaMask, to connect your wallet.",
  },
  transactionError: {
    status: NotificationDataStatusEnum.ERROR,
    title: "Try Again",
    text: "We are having issues processing your request, please try again",
  },
  insufficientFundsError: {
    status: NotificationDataStatusEnum.ERROR,
    title: "Insufficient Funds",
    text: "Please fund your account, then try again",
  },
  somethingWentWrong: {
    status: NotificationDataStatusEnum.ERROR,
    title: "Something went wrong",
    text: "It is not you, it us. Please try again",
  },
  connectWallet: {
    status: NotificationDataStatusEnum.INFO,
    title: "Connect Wallet",
    text: "To buy an NFT, we need you to connect your wallet",
  },
  requestCancelled: {
    status: NotificationDataStatusEnum.INFO,
    title: "Action cancelled",
    text: "Try again to initiate action",
  },
  savedChanges: {
    status: NotificationDataStatusEnum.SUCCESS,
    title: "Saved changes",
    text: "All good, changes have been saved",
  },
  sessionExpired: {
    status: NotificationDataStatusEnum.INFO,
    title: "Session expired",
    text: "Please login",
  },
};
