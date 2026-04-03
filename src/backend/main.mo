import Array "mo:base/Array";
import Error "mo:base/Error";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Map "mo:core/Map";

actor {
  type Role = { #user; #admin };

  type UserRecord = { username : Text; pin : Text };

  type OldActivity = {
    id : Nat;
    dateKey : Text;
    username : Text;
    startTime : Text;
    emoji : Text;
    durationHours : Nat;
    note : Text;
  };

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

  // Legacy stable vars -- kept for upgrade compatibility (migration), NOT used in logic
  stable var users : Map.Map<Text, Text> = Map.empty();
  stable var activityDays : Map.Map<Text, Map.Map<Nat, OldActivity>> = Map.empty();
  stable var isLoggedIn : Map.Map<Text, Role> = Map.empty();
  stable var nextActivityId : Nat = 0;

  // Active flat stable vars
  stable var _users : [UserRecord] = [];
  stable var _activities : [Activity] = [];
  stable var _messages : [Message] = [];
  stable var _nextActivityId : Nat = 0;
  stable var _nextMessageId : Nat = 0;
  // Visibility: (activityId, vis) where vis = "wszyscy" | comma-separated usernames
  stable var _visibility : [(Nat, Text)] = [];
  // Per-user colors: (username, cssColor)
  stable var _userColors : [(Text, Text)] = [];
  // GPX files
  stable var _gpxFiles : [GpxFile] = [];
  stable var _nextGpxId : Nat = 0;

  // AUTH
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

  // USER MANAGEMENT
  public shared func addUser(name : Text, pin : Text, color : Text) : async () {
    if (pin.size() != 4) {
      throw Error.reject("PIN must be 4 digits");
    };
    for (u in _users.vals()) {
      if (u.username == name) {
        throw Error.reject("User already exists");
      };
    };
    _users := Array.append(_users, [{ username = name; pin = pin }]);
    _userColors := Array.filter<(Text, Text)>(_userColors, func(c) { c.0 != name });
    if (color != "") {
      _userColors := Array.append(_userColors, [(name, color)]);
    };
  };

  public shared func removeUser(name : Text) : async () {
    _users := Array.filter<UserRecord>(_users, func(u) { u.username != name });
    _userColors := Array.filter<(Text, Text)>(_userColors, func(c) { c.0 != name });
  };

  public query func getUsers() : async [(Text, Text, Text)] {
    Array.map<UserRecord, (Text, Text, Text)>(_users, func(u) {
      var color = "";
      for (c in _userColors.vals()) {
        if (c.0 == u.username) { color := c.1 };
      };
      (u.username, u.pin, color)
    });
  };

  // ACTIVITIES
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

  public shared func setVisibility(activityId : Nat, vis : Text) : async () {
    _visibility := Array.filter<(Nat, Text)>(
      _visibility,
      func(v) { v.0 != activityId },
    );
    if (vis != "wszyscy") {
      _visibility := Array.append(_visibility, [(activityId, vis)]);
    };
  };

  func getVisForActivity(activityId : Nat) : Text {
    for (v in _visibility.vals()) {
      if (v.0 == activityId) { return v.1 };
    };
    "wszyscy";
  };

  func canUserSeeActivity(activity : Activity, callerUsername : Text) : Bool {
    if (activity.username == callerUsername) { return true };
    let vis = getVisForActivity(activity.id);
    if (vis == "wszyscy") { return true };
    let parts = Text.split(vis, #char ',');
    for (p in parts) {
      if (p == callerUsername) { return true };
    };
    false;
  };

  public query func getActivitiesForDay(dateKey : Text) : async [Activity] {
    Array.filter<Activity>(_activities, func(a) { a.dateKey == dateKey });
  };

  public query func getActivitiesFiltered(dateKey : Text, callerUsername : Text) : async [Activity] {
    Array.filter<Activity>(_activities, func(a) {
      a.dateKey == dateKey and canUserSeeActivity(a, callerUsername)
    });
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
    _visibility := Array.filter<(Nat, Text)>(_visibility, func(v) { v.0 != activityId });
    _activities.size() < before;
  };

  public shared func purgeOldActivities(todayKey : Text) : async Bool {
    _activities := Array.filter<Activity>(_activities, func(a) { a.dateKey >= todayKey });
    true;
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

  // MESSAGES / CHAT
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

  // GPX FILES
  public shared func addGpxFile(username : Text, filename : Text, content : Text) : async Nat {
    if (content.size() > 500_000) {
      throw Error.reject("Plik GPX zbyt duzy (max 500KB)");
    };
    // Auto-delete oldest if already 3 files
    if (_gpxFiles.size() >= 3) {
      var oldestIdx = 0;
      var oldestTs = _gpxFiles[0].timestamp;
      var i = 1;
      while (i < _gpxFiles.size()) {
        if (_gpxFiles[i].timestamp < oldestTs) {
          oldestTs := _gpxFiles[i].timestamp;
          oldestIdx := i;
        };
        i += 1;
      };
      let oldestId = _gpxFiles[oldestIdx].id;
      _gpxFiles := Array.filter<GpxFile>(_gpxFiles, func(f) { f.id != oldestId });
    };
    let id = _nextGpxId;
    _nextGpxId += 1;
    _gpxFiles := Array.append(
      _gpxFiles,
      [{ id; username; filename; content; timestamp = Time.now() }],
    );
    id;
  };

  public query func getGpxFiles() : async [(Nat, Text, Text, Int)] {
    Array.map<GpxFile, (Nat, Text, Text, Int)>(_gpxFiles, func(f) {
      (f.id, f.username, f.filename, f.timestamp)
    });
  };

  public query func getGpxContent(fileId : Nat) : async Text {
    for (f in _gpxFiles.vals()) {
      if (f.id == fileId) { return f.content };
    };
    throw Error.reject("Plik nie znaleziony");
  };

  public shared func deleteGpxFile(fileId : Nat) : async Bool {
    let before = _gpxFiles.size();
    _gpxFiles := Array.filter<GpxFile>(_gpxFiles, func(f) { f.id != fileId });
    _gpxFiles.size() < before;
  };
};
