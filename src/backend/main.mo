import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";

actor {
  type Role = {
    #user;
    #admin;
  };

  type User = {
    name : Text;
    pin : Text;
  };

  type Activity = {
    id : Nat;
    dateKey : Text;
    username : Text;
    startTime : Text;
    emoji : Text;
    durationHours : Nat;
    note : Text;
  };

  let users = Map.empty<Text, User>();
  let activities = Map.empty<Text, Map.Map<Nat, Activity>>();
  var nextActivityId = 0;

  // AUTH
  public shared func login(pin : Text) : async (Text, Role) {
    if (pin == "6464") { return ("admin", #admin) };

    for ((_, user) in users.entries()) {
      if (user.pin == pin) {
        return (user.name, #user);
      };
    };
    Runtime.trap("Wrong PIN");
  };

  // USER MGMT
  public shared func addUser(name : Text, pin : Text) : async () {
    if (pin.size() != 4) {
      Runtime.trap("PIN must be 4 digits");
    };
    let newUser : User = { name; pin };
    users.add(name, newUser);
  };

  public shared func removeUser(name : Text) : async () {
    if (not users.containsKey(name)) {
      Runtime.trap("User does not exist");
    };
    users.remove(name);
  };

  public query func getUsers() : async [(Text, Text)] {
    users.entries().toArray().map(func((name, user)) { (name, user.pin) });
  };

  // ACTIVITIES
  public shared func addActivity(dateKey : Text, username : Text, startTime : Text, emoji : Text, durationHours : Nat, note : Text) : async () {
    if (note.size() > 80) {
      Runtime.trap("Note too long");
    };

    let dayActivities = switch (activities.get(dateKey)) {
      case (null) { Map.empty<Nat, Activity>() };
      case (?existing) { existing };
    };

    var userActivitiesCount = 0;
    for ((_, act) in dayActivities.entries()) {
      if (act.username == username) {
        userActivitiesCount += 1;
      };
    };
    if (userActivitiesCount >= 3) {
      Runtime.trap("Max 3 activities per user per day");
    };

    let newActivity : Activity = {
      id = nextActivityId;
      dateKey;
      username;
      startTime;
      emoji;
      durationHours;
      note;
    };

    dayActivities.add(nextActivityId, newActivity);
    activities.add(dateKey, dayActivities);
    nextActivityId += 1;
  };

  public shared func updateActivityTime(activityId : Nat, newStartTime : Text) : async () {
    for ((_, dayActs) in activities.entries()) {
      switch (dayActs.get(activityId)) {
        case (null) {};
        case (?activity) {
          let updatedActivity = { activity with startTime = newStartTime };
          dayActs.add(activityId, updatedActivity);
          return;
        };
      };
    };
    Runtime.trap("Activity not found");
  };

  public shared func deleteActivity(activityId : Nat) : async () {
    for ((_, dayActs) in activities.entries()) {
      if (dayActs.containsKey(activityId)) {
        dayActs.remove(activityId);
        return;
      };
    };
    Runtime.trap("Activity not found");
  };

  public shared func purgeOldActivities(todayKey : Text) : async () {
    let oldKeys = activities.keys().filter(func(dateKey) { dateKey < todayKey }).toArray();
    for (dateKey in oldKeys.vals()) {
      activities.remove(dateKey);
    };
  };

  public query func getActivitiesForDateRange(dateKeys : [Text]) : async [([Nat], Text)] {
    dateKeys.map(
      func(dateKey) {
        switch (activities.get(dateKey)) {
          case (null) { ([], dateKey) };
          case (?dayActs) {
            let sortedActivities = dayActs.entries().toArray().sort(
              func(entry1, entry2) { Nat.compare(entry1.0, entry2.0) }
            );
            let ids = sortedActivities.map(func((id, _)) { id });
            (ids, dateKey);
          };
        };
      }
    );
  };

  public query func getActivitiesForDay(dateKey : Text) : async [Activity] {
    switch (activities.get(dateKey)) {
      case (null) { [] };
      case (?dayActs) { dayActs.values().toArray() };
    };
  };

  public shared func joinActivity(existingActivityId : Nat, username : Text) : async () {
    for ((_, dayActs) in activities.entries()) {
      switch (dayActs.get(existingActivityId)) {
        case (null) {};
        case (?activity) {
          await addActivity(
            activity.dateKey,
            username,
            activity.startTime,
            activity.emoji,
            activity.durationHours,
            activity.note,
          );
          return;
        };
      };
    };
    Runtime.trap("Activity not found");
  };
};
