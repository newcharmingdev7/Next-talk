import React from "react";
import TestRenderer from "react-test-renderer";

import { PropTypesOf } from "talk-ui/types";

import Message from "./Message";
import MessageIcon from "./MessageIcon";

it("renders correctly", () => {
  const props: PropTypesOf<typeof Message> = {
    className: "custom",
    children: "Hello World",
  };
  const renderer = TestRenderer.create(<Message {...props} />);
  expect(renderer.toJSON()).toMatchSnapshot();
});

it("renders icon", () => {
  const props: PropTypesOf<typeof Message> = {
    className: "custom",
  };

  const renderer = TestRenderer.create(
    <Message {...props}>
      <MessageIcon>alert</MessageIcon>Alert Message
    </Message>
  );
  expect(renderer.toJSON()).toMatchSnapshot();
});
