/* eslint-disable @typescript-eslint/no-explicit-any */
import { Collection } from "discord.js";

declare module "discord.js" {
  export interface Client {
    commands: Collection<unknown, any>;
  }
}
