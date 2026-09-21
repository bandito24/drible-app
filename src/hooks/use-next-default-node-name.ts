import AsyncStorage from "@react-native-async-storage/async-storage";

export default function useNextDefaultNodeName() {
  const getNextDefaultName = async () => {
    let incr = 1;
    let nextName: string = "";
    let exists = true;
    while (exists) {
      nextName = `Drippet_${incr}`;
      const storedValue = await AsyncStorage.getItem(nextName);
      exists = storedValue ? true : false;
      incr += 1;
    }

    return nextName;
  };
  return getNextDefaultName;
}
