/* eslint-disable */

// @ts-nocheck

import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export interface Activity {
  'id' : bigint,
  'startTime' : string,
  'dateKey' : string,
  'username' : string,
  'durationHours' : bigint,
  'emoji' : string,
}
export interface Message {
  'id' : bigint,
  'threadId' : string,
  'author' : string,
  'text' : string,
  'timestamp' : bigint,
}
export type Role = { 'admin' : null } |
  { 'user' : null };
export interface _SERVICE {
  'addActivity' : ActorMethod<
    [string, string, string, string, bigint],
    bigint
  >,
  'addMessage' : ActorMethod<[string, string, string], bigint>,
  'addUser' : ActorMethod<[string, string], undefined>,
  'deleteActivity' : ActorMethod<[bigint], boolean>,
  'getActivitiesForDay' : ActorMethod<[string], Array<Activity>>,
  'getActivitiesFiltered' : ActorMethod<[string, string], Array<Activity>>,
  'getMessages' : ActorMethod<[string], Array<Message>>,
  'getUsers' : ActorMethod<[], Array<[string, string]>>,
  'joinActivity' : ActorMethod<[bigint, string], bigint>,
  'login' : ActorMethod<[string], [string, Role]>,
  'purgeOldActivities' : ActorMethod<[string], boolean>,
  'removeUser' : ActorMethod<[string], undefined>,
  'setVisibility' : ActorMethod<[bigint, string], undefined>,
  'updateActivityTime' : ActorMethod<[bigint, string], boolean>,
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
