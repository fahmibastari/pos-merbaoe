"use client";

import Form from "next/form";
import { Fragment, type ComponentProps } from "react";

/** Replace dirty controls when the server applies a different URL/filter state. */
export function FilterForm({
  resetKey,
  children,
  ...props
}: ComponentProps<typeof Form> & { resetKey: string }) {
  return (
    <Form
      {...props}
      onClickCapture={(event) => {
        const link = event.target instanceof Element ? event.target.closest("a") : null;
        if (link && link.pathname === window.location.pathname && !link.search) {
          // Reset also works when the URL is already the default URL.
          event.currentTarget.reset();
        }
      }}
    >
      <Fragment key={resetKey}>{children}</Fragment>
    </Form>
  );
}
