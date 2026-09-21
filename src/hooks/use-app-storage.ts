import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MakeNotification from "@/lib/MakeNotification";

export default function useAppStorage<T>(key: string) {
  const [storedValue, setStoredValue] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await AsyncStorage.getItem(key);
        setStoredValue(data ? JSON.parse(data) : data);
      } catch (e) {
        console.error(e);
        MakeNotification.alertFailed("Failed To Retrieve Node Data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  });

  async function setItem(key: string, data: T) {
    try {
      AsyncStorage.setItem(key, JSON.stringify(data));
      setStoredValue(data);
    } catch (e) {
      console.error(e);
      MakeNotification.alertFailed("Failed To Store Node Data");
    }
  }
  return { storedValue, setItem, isLoading };
}
