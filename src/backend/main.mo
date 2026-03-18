import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";

import Iter "mo:core/Iter";


actor {
  type Role = {
    #user;
    #admin;
  };

  type Activity = {
    id : Nat;
    dateKey : Text;
    username : Text;
    startTime : Text;
    emoji : Text;
    durationHours : Nat; // 0 = unlimited
    note : Text;
  };

  var nextActivityId = 0;
  let users = Map.empty<Text, Text>(); // username -> pin
  let activityDays = Map.empty<Text, Map.Map<Nat, Activity>>();
  let isLoggedIn = Map.empty<Text, Role>(); // sessionId -> Role (admin/user)

  // AUTH
  public shared ({ caller }) func login(pin : Text) : async (Text, Role) {
    if (pin == "6464") {
      return ("admin", #admin);
    };

    switch (users.keys().find(func(user) { pin == getPin(user) })) {
      case (?username) { (username, #user) };
      case (null) { Runtime.trap("Wrong PIN") };
    };
  };

  func getPin(user : Text) : Text {
    switch (users.get(user)) {
      case (?pin) { pin };
      case (null) { "" };
    };
  };

  public query ({ caller }) func _isAdmin(sessionId : Text) : async Bool {
    switch (isLoggedIn.get(sessionId)) {
      case (?role) { role == #admin };
      case (null) { false };
    };
  };

  // USER MANAGEMENT
  public shared ({ caller }) func addUser(name : Text, pin : Text) : async () {
    if (pin.size() != 4) {
      Runtime.trap("PIN must be 4 digits");
    };
    if (users.containsKey(name)) {
      Runtime.trap("User already exists");
    };
    users.add(name, pin);
  };

  public shared ({ caller }) func removeUser(name : Text) : async () {
    if (not users.containsKey(name)) {
      Runtime.trap("User does not exist");
    };
    users.remove(name);
  };

  public query ({ caller }) func getUsers() : async [(Text, Text)] {
    users.toArray();
  };

  // ACTIVITY / CALENDAR FUNC
  func countDailyUserActivities(dateKey : Text, username : Text) : Nat {
    switch (activityDays.get(dateKey)) {
      case (?dayActivities) {
        dayActivities.values().foldLeft(
          0,
          func(count, activity) { if (activity.username == username) { count + 1 } else { count } },
        );
      };
      case (null) { 0 };
    };
  };

  public shared ({ caller }) func addActivity(dateKey : Text, username : Text, startTime : Text, emoji : Text, durationHours : Nat, note : Text) : async Nat {
    if (note.size() > 160) { Runtime.trap("Note too long") };

    if (countDailyUserActivities(dateKey, username) >= 3) {
      Runtime.trap("Max 3 activities per user per day");
    };

    let activity : Activity = {
      id = nextActivityId;
      dateKey;
      username;
      startTime;
      emoji;
      durationHours;
      note;
    };

    let dayActivities = switch (activityDays.get(dateKey)) {
      case (null) { Map.empty<Nat, Activity>() };
      case (?existing) { existing };
    };

    dayActivities.add(nextActivityId, activity);
    activityDays.add(dateKey, dayActivities);

    nextActivityId += 1;
    activity.id;
  };

  public shared ({ caller }) func updateActivityTime(activityId : Nat, newStartTime : Text) : async Bool {
    for ((_, dayActs) in activityDays.entries()) {
      switch (dayActs.get(activityId)) {
        case (null) {};
        case (?activity) {
          let updatedActivity = { activity with startTime = newStartTime };
          dayActs.add(activityId, updatedActivity);
          return true;
        };
      };
    };
    Runtime.trap("Activity not found");
  };

  public shared ({ caller }) func deleteActivity(activityId : Nat) : async Bool {
    for ((_, dayActs) in activityDays.entries()) {
      if (dayActs.containsKey(activityId)) {
        dayActs.remove(activityId);
        return true;
      };
    };
    Runtime.trap("Activity not found");
  };

  public shared ({ caller }) func purgeOldActivities(todayKey : Text) : async Bool {
    let oldKeys = activityDays.keys().filter(func(dateKey) { dateKey < todayKey }).toArray();
    for (dateKey in oldKeys.vals()) {
      activityDays.remove(dateKey);
    };
    true;
  };

  public query ({ caller }) func getActivitiesForDay(dateKey : Text) : async [Activity] {
    switch (activityDays.get(dateKey)) {
      case (null) { [] };
      case (?dayActs) { dayActs.values().toArray() };
    };
  };

  public shared ({ caller }) func joinActivity(existingActivityId : Nat, username : Text) : async Nat {
    for ((_, dayActs) in activityDays.entries()) {
      switch (dayActs.get(existingActivityId)) {
        case (null) {};
        case (?activity) {
          if (countDailyUserActivities(activity.dateKey, username) >= 3) {
            Runtime.trap("Max 3 activities per user per day");
          };

          return await addActivity(
            activity.dateKey,
            username,
            activity.startTime,
            activity.emoji,
            activity.durationHours,
            ""
          );
        };
      };
    };
    Runtime.trap("Activity not found");
  };
};
