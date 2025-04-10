"use client";

import { fine } from "@/lib/fine";
import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({
  Component,
}: {
  Component: () => JSX.Element;
}) => {
  const {
    data: session,
    isPending, //loading state
    error, //error object
  } = fine.auth.useSession();

  if (isPending) return <div></div>;

  return !session?.user ? <Navigate to="/login" /> : <Component />;
};
