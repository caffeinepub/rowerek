/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

export const Activity = IDL.Record({
  'id' : IDL.Nat,
  'startTime' : IDL.Text,
  'dateKey' : IDL.Text,
  'username' : IDL.Text,
  'durationHours' : IDL.Nat,
  'emoji' : IDL.Text,
});

export const Message = IDL.Record({
  'id' : IDL.Nat,
  'threadId' : IDL.Text,
  'author' : IDL.Text,
  'text' : IDL.Text,
  'timestamp' : IDL.Int,
});

export const Role = IDL.Variant({ 'admin' : IDL.Null, 'user' : IDL.Null });

export const idlService = IDL.Service({
  'addActivity' : IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat],
      [IDL.Nat],
      [],
    ),
  'addGpxFile' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
  'addMessage' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
  'addUser' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [], []),
  'deleteActivity' : IDL.Func([IDL.Nat], [IDL.Bool], []),
  'deleteGpxFile' : IDL.Func([IDL.Nat], [IDL.Bool], []),
  'getActivitiesForDay' : IDL.Func([IDL.Text], [IDL.Vec(Activity)], ['query']),
  'getActivitiesFiltered' : IDL.Func([IDL.Text, IDL.Text], [IDL.Vec(Activity)], ['query']),
  'getGpxContent' : IDL.Func([IDL.Nat], [IDL.Text], ['query']),
  'getGpxFiles' : IDL.Func(
      [],
      [IDL.Vec(IDL.Tuple(IDL.Nat, IDL.Text, IDL.Text, IDL.Int))],
      ['query'],
    ),
  'getMessages' : IDL.Func([IDL.Text], [IDL.Vec(Message)], ['query']),
  'getUsers' : IDL.Func(
      [],
      [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text, IDL.Text))],
      ['query'],
    ),
  'joinActivity' : IDL.Func([IDL.Nat, IDL.Text], [IDL.Nat], []),
  'login' : IDL.Func([IDL.Text], [IDL.Text, Role], []),
  'purgeOldActivities' : IDL.Func([IDL.Text], [IDL.Bool], []),
  'removeUser' : IDL.Func([IDL.Text], [], []),
  'setVisibility' : IDL.Func([IDL.Nat, IDL.Text], [], []),
  'updateActivityTime' : IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const Activity = IDL.Record({
    'id' : IDL.Nat,
    'startTime' : IDL.Text,
    'dateKey' : IDL.Text,
    'username' : IDL.Text,
    'durationHours' : IDL.Nat,
    'emoji' : IDL.Text,
  });
  const Message = IDL.Record({
    'id' : IDL.Nat,
    'threadId' : IDL.Text,
    'author' : IDL.Text,
    'text' : IDL.Text,
    'timestamp' : IDL.Int,
  });
  const Role = IDL.Variant({ 'admin' : IDL.Null, 'user' : IDL.Null });

  return IDL.Service({
    'addActivity' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat],
        [IDL.Nat],
        [],
      ),
    'addGpxFile' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
    'addMessage' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
    'addUser' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [], []),
    'deleteActivity' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'deleteGpxFile' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'getActivitiesForDay' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(Activity)],
        ['query'],
      ),
    'getActivitiesFiltered' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Vec(Activity)],
        ['query'],
      ),
    'getGpxContent' : IDL.Func([IDL.Nat], [IDL.Text], ['query']),
    'getGpxFiles' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Nat, IDL.Text, IDL.Text, IDL.Int))],
        ['query'],
      ),
    'getMessages' : IDL.Func([IDL.Text], [IDL.Vec(Message)], ['query']),
    'getUsers' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text, IDL.Text))],
        ['query'],
      ),
    'joinActivity' : IDL.Func([IDL.Nat, IDL.Text], [IDL.Nat], []),
    'login' : IDL.Func([IDL.Text], [IDL.Text, Role], []),
    'purgeOldActivities' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'removeUser' : IDL.Func([IDL.Text], [], []),
    'setVisibility' : IDL.Func([IDL.Nat, IDL.Text], [], []),
    'updateActivityTime' : IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
  });
};

export const init = ({ IDL }) => { return []; };
