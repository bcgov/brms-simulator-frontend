"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { Alert, Button } from "antd";

function NoOrgAccessComponent() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  useEffect(() => {
    axios.post("/auth/github/logout");
    localStorage.removeItem("token");
  }, []);

  return (
    <div>
      <Alert
        message={<b>No Org Access</b>}
        description={
          <div>
            <p>Your account has no organization authorization.</p>
            <p>
              Hit the &quot;Re-Login&quot; button below and then make sure to hit the &quot;Authorize&quot; button shown
              below before continuing.
            </p>
            <div>
              <Image src="/images/github-authorize-screen.png" alt="GitHub Authorize Screen" width={500} height={370} />
            </div>
            <br />
            <Button href={`/auth/github?returnUrl=${returnUrl}`} type="primary">
              Re-Login
            </Button>
          </div>
        }
        type="error"
        showIcon
      />
    </div>
  );
}

export default function NoOrgAccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NoOrgAccessComponent />
    </Suspense>
  );
}
