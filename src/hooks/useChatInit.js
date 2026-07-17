// hooks/useChatInit.js
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchConversations } from "@/store/redux/chatSlice";

export function useChatInit() {
  const dispatch = useDispatch();
  const companyId = useSelector((state) => state.auth?.user?.company_currentid);
  const isLoggedIn = useSelector((state) => !!state.auth?.user);
  const isCustomer = useSelector(
    (state) =>
      state.auth?.user?.roles?.some((r) => r.code === "CUSTOMER") ?? false,
  );

  useEffect(() => {
    if (!isLoggedIn || !companyId || isCustomer) return;
    dispatch(fetchConversations({ companyId }));
  }, [isLoggedIn, companyId, isCustomer]);
}
