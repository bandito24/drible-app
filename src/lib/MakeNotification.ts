import Toast from "react-native-toast-message";

export default class MakeNotification {
  public static alertFailed(message: string, header: string = "Error") {
    Toast.show({
      type: "error",
      text1: header,
      text2: message,
    });
  }
  public static alertSuccess(message: string, header: string = "Success") {
    Toast.show({
      type: "success",
      text1: header,
      text2: message,
    });
  }
}
