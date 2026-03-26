import Array "mo:base/Array";
import Error "mo:base/Error";
import Map "mo:core/Map";
import Time "mo:base/Time";

persistent actor {
  type Role = { #user; #admin };

  // Old types kept for stable-var upgrade compatibility
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

  // Old let-bindings kept for upgrade compatibility
  let users : Map.Map<Text, Text> = Map.empty<Text, Text>();
  let activityDays : Map.Map<Text, Map.Map<Nat, OldActivity>> =
    Map.empty<Text, Map.Map<Nat, OldActivity>>();
  let isLoggedIn : Map.Map<Text, Role> = Map.empty<Text, Role>();
  stable var nextActivityId : Nat = 0;

  // Active stable vars (flat arrays)
  stable var _users : [UserRecord] = [];
  stable var _activities : [Activity] = [];
  stable var _messages : [Message] = [];
  stable var _nextActivityId : Nat = 0;
  stable var _nextMessageId : Nat = 0;

  // ── AUTH ────────────────────────────────────────────────────────────────────
  public shared func login(pin : Text) : async (Text, Role) {
    if (pin == "6464") {
      return ("admin", #admin);
    };
    for (u in _users.vals()) {
      if (u.pin == pin) {
        return (u.username, #user);
      };
    };
    throw Error.reject("Wrong PIN");
  };

  // ── USER MANAGEMENT ─────────────────────────────────────────────────────────
  public shared func addUser(name : Text, pin : Text) : async () {
    if (pin.size() != 4) {
      throw Error.reject("PIN must be 4 digits");
    };
    for (u in _users.vals()) {
      if (u.username == name) {
        throw Error.reject("User already exists");
      };
    };
    _users := Array.append(_users, [{ username = name; pin = pin }]);
  };

  public shared func removeUser(name : Text) : async () {
    _users := Array.filter<UserRecord>(_users, func(u) { u.username != name });
  };

  public query func getUsers() : async [(Text, Text)] {
    Array.map<UserRecord, (Text, Text)>(_users, func(u) { (u.username, u.pin) });
  };

  // ── ACTIVITIES ───────────────────────────────────────────────────────────────
  func countUserDay(dateKey : Text, username : Text) : Nat {
    var count = 0;
    for (a in _activities.vals()) {
      if (a.dateKey == dateKey and a.username == username) { count += 1 };
    };
    count;
  };

  func timeConflict(dateKey : Text, username : Text, startTime : Text, excludeId : ?Nat) : Bool {
    for (a in _activities.vals()) {
      if (a.dateKey == dateKey and a.username == username and a.startTime == startTime) {
        switch excludeId {
          case (?eid) { if (a.id != eid) { return true } };
          case null { return true };
        };
      };
    };
    false;
  };

  public shared func addActivity(
    dateKey : Text,
    username : Text,
    startTime : Text,
    emoji : Text,
    durationHours : Nat,
  ) : async Nat {
    if (countUserDay(dateKey, username) >= 3) {
      throw Error.reject("Max 3 activities per user per day");
    };
    if (timeConflict(dateKey, username, startTime, null)) {
      throw Error.reject("Duplicate time");
    };
    let id = _nextActivityId;
    _nextActivityId += 1;
    _activities := Array.append(
      _activities,
      [{ id; dateKey; username; startTime; emoji; durationHours }],
    );
    id;
  };

  public shared func updateActivityTime(activityId : Nat, newStartTime : Text) : async Bool {
    var found = false;
    _activities := Array.map<Activity, Activity>(_activities, func(a) {
      if (a.id == activityId) {
        found := true;
        { id = a.id; dateKey = a.dateKey; username = a.username;
          startTime = newStartTime; emoji = a.emoji; durationHours = a.durationHours };
      } else { a };
    });
    found;
  };

  public shared func deleteActivity(activityId : Nat) : async Bool {
    let before = _activities.size();
    _activities := Array.filter<Activity>(_activities, func(a) { a.id != activityId });
    _activities.size() < before;
  };

  public shared func purgeOldActivities(todayKey : Text) : async Bool {
    _activities := Array.filter<Activity>(_activities, func(a) { a.dateKey >= todayKey });
    true;
  };

  public query func getActivitiesForDay(dateKey : Text) : async [Activity] {
    Array.filter<Activity>(_activities, func(a) { a.dateKey == dateKey });
  };

  public shared func joinActivity(existingActivityId : Nat, username : Text) : async Nat {
    for (a in _activities.vals()) {
      if (a.id == existingActivityId) {
        if (countUserDay(a.dateKey, username) >= 3) {
          throw Error.reject("Max 3 activities per user per day");
        };
        if (timeConflict(a.dateKey, username, a.startTime, null)) {
          throw Error.reject("Duplicate time");
        };
        let id = _nextActivityId;
        _nextActivityId += 1;
        _activities := Array.append(
          _activities,
          [{ id; dateKey = a.dateKey; username;
             startTime = a.startTime; emoji = a.emoji; durationHours = a.durationHours }],
        );
        return id;
      };
    };
    throw Error.reject("Activity not found");
  };

  // ── MESSAGES / CHAT ──────────────────────────────────────────────────────────
  public shared func addMessage(threadId : Text, author : Text, text : Text) : async Nat {
    if (text.size() > 500) {
      throw Error.reject("Message too long");
    };
    let id = _nextMessageId;
    _nextMessageId += 1;
    _messages := Array.append(
      _messages,
      [{ id; threadId; author; text; timestamp = Time.now() }],
    );
    id;
  };

  public query func getMessages(threadId : Text) : async [Message] {
    Array.filter<Message>(_messages, func(m) { m.threadId == threadId });
  };
};
