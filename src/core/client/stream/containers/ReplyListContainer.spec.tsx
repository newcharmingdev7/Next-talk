import { shallow, ShallowWrapper } from "enzyme";
import { noop } from "lodash";
import React from "react";

import { PropTypesOf } from "talk-framework/types";

import ReplyList from "../components/ReplyList";
import { ReplyListContainer } from "./ReplyListContainer";

it("renders correctly", () => {
  const props: any = {
    comment: {
      id: "comment-id",
      replies: {
        edges: [{ node: { id: "comment-1" } }, { node: { id: "comment-2" } }],
      },
    },
    relay: {
      hasMore: noop,
      isLoading: noop,
    },
  };
  const wrapper = shallow(<ReplyListContainer {...props} />);
  expect(wrapper).toMatchSnapshot();
});

it("renders correctly when replies are null", () => {
  const props: any = {
    comment: {
      id: "comment-id",
      replies: null,
    },
    relay: {
      hasMore: noop,
      isLoading: noop,
    },
  };
  const wrapper = shallow(<ReplyListContainer {...props} />);
  expect(wrapper).toMatchSnapshot();
});

describe("when has more replies", () => {
  let finishLoading: ((error?: Error) => void) | null = null;
  const props: PropTypesOf<ReplyListContainer> = {
    comment: {
      id: "comment-id",
      replies: {
        edges: [{ node: { id: "comment-1" } }, { node: { id: "comment-2" } }],
      },
    },
    relay: {
      hasMore: () => true,
      isLoading: () => false,
      loadMore: (_: any, callback: () => void) => (finishLoading = callback),
    } as any,
  };

  let wrapper: ShallowWrapper;

  beforeAll(() => (wrapper = shallow(<ReplyListContainer {...props} />)));

  it("renders hasMore", () => {
    expect(wrapper).toMatchSnapshot();
  });

  describe("when showing all", () => {
    beforeAll(() => {
      wrapper
        .find(ReplyList)
        .props()
        .onShowAll();
    });
    it("calls relay loadMore", () => {
      expect(finishLoading).not.toBeNull();
    });
    it("disables show all button", () => {
      wrapper.update();
      expect(wrapper).toMatchSnapshot();
    });
    it("enable show all button after loading is done", () => {
      finishLoading!();
      wrapper.update();
      expect(wrapper).toMatchSnapshot();
    });
  });
});
