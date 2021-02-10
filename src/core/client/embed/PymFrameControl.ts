import pym from "pym.js";

import { CleanupCallback, Decorator } from "./decorators";
import {
  FrameControl,
  FrameControlConfig,
  FrameControlFactory,
} from "./FrameControl";

export const defaultPymControlFactory: FrameControlFactory = (config) =>
  new PymFrameControl(config);

export default class PymFrameControl implements FrameControl {
  private readonly id: string;
  private readonly url: string;
  private readonly title: string;
  private readonly decorators: ReadonlyArray<Decorator>;

  public rendered = false;

  private parent: pym.Parent | null;
  private cleanups: CleanupCallback[] | null;

  constructor(config: FrameControlConfig) {
    this.id = config.id;
    this.url = config.url;
    this.title = config.title;
    this.decorators = config.decorators;
  }

  public render() {
    if (this.rendered) {
      // The instance has already been removed.
      return;
    }

    const name = `${this.id}_iframe`;

    if (!document.getElementById("coral-embed-style")) {
      const headElements = document.getElementsByTagName("head");
      if (headElements.length > 0) {
        const head = headElements[0];
        const style = document.createElement("style");
        style.id = "coral-embed-style";
        style.type = "text/css";
        style.innerHTML =
          "body.coralBodyNoScroll { overflow: hidden; !important }";
        head.appendChild(style);
      } else {
        // eslint-disable-next-line no-console
        console.warn("Coral: Head Element was not found.");
      }
    }

    // Create the new pym.Parent that when created will create the iFrame.
    const parent = new pym.Parent(this.id, this.url, {
      title: this.title,
      id: name,
      name,
    });

    // Run all the decorators on the parent, and capture any cleanup functions.
    const cleanups = this.decorators
      .map((enhance) => enhance(parent))
      .filter((cb) => !!cb) as CleanupCallback[];

    this.rendered = true;
    this.parent = parent;
    this.cleanups = cleanups;
  }

  public sendMessage(id: string, message = "") {
    if (!this.rendered || !this.parent) {
      throw new Error("not mounted");
    }

    this.parent.sendMessage(id, message);
  }

  public remove() {
    if (!this.rendered || !this.parent || !this.cleanups) {
      throw new Error("not mounted");
    }

    this.cleanups.forEach((cb) => cb());
    this.cleanups = null;

    this.parent.remove();
    this.parent = null;

    this.rendered = false;
  }
}
