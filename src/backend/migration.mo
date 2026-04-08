import Map "mo:core/Map";

module {
  // Old types inline (from .old/src/backend/main.mo)
  type Role = { #user; #admin };

  type OldActivity = {
    id : Nat;
    dateKey : Text;
    username : Text;
    startTime : Text;
    emoji : Text;
    durationHours : Nat;
    note : Text;
  };

  type UserRecord = { username : Text; pin : Text };

  type Activity = {
    id : Nat;
    dateKey : Text;
    username : Text;
    startTime : Text;
    emoji : Text;
    durationHours : Nat;
  };

  type Message = {
    id : Nat;
    threadId : Text;
    author : Text;
    text : Text;
    timestamp : Int;
  };

  type GpxFile = {
    id : Nat;
    username : Text;
    filename : Text;
    content : Text;
    timestamp : Int;
  };

  // OldActor: all stable fields from the PREVIOUS deployed version
  type OldActor = {
    users : Map.Map<Text, Text>;
    activityDays : Map.Map<Text, Map.Map<Nat, OldActivity>>;
    isLoggedIn : Map.Map<Text, Role>;
    nextActivityId : Nat;
    _users : [UserRecord];
    _activities : [Activity];
    _messages : [Message];
    _nextActivityId : Nat;
    _nextMessageId : Nat;
    _visibility : [(Nat, Text)];
    _userColors : [(Text, Text)];
    _gpxFiles : [GpxFile];
    _nextGpxId : Nat;
  };

  // NewActor: all stable fields in the NEW version (no stable keyword, but listed here)
  type NewActor = {
    _users : [UserRecord];
    _activities : [Activity];
    _messages : [Message];
    _nextActivityId : Nat;
    _nextMessageId : Nat;
    _visibility : [(Nat, Text)];
    _userColors : [(Text, Text)];
    _gpxFiles : [GpxFile];
    _nextGpxId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    // Consume legacy Map vars (users, activityDays, isLoggedIn, nextActivityId) by
    // ignoring them -- they contained no useful data in practice.
    // Carry forward all active flat vars unchanged.
    {
      _users = old._users;
      _activities = old._activities;
      _messages = old._messages;
      _nextActivityId = old._nextActivityId;
      _nextMessageId = old._nextMessageId;
      _visibility = old._visibility;
      _userColors = old._userColors;
      _gpxFiles = old._gpxFiles;
      _nextGpxId = old._nextGpxId;
    };
  };
};
