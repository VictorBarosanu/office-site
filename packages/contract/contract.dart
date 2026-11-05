// The field app's data contract, v1 (2026-10-13) — the Dart mirror of
// contract.ts. The truth is README.md; test/contract_test.dart runs this file
// over the same fixtures as test/contract.test.ts, so the two cannot drift.
// No package dependency beyond dart:core.
//
// fromJson throws a FormatException when a field is missing or has the wrong
// type (or an enum value is unknown); validate* returns the list of rule
// violations (empty = valid), one "field: message" string each, mirroring
// every zod rule. The single-field validators (validateStories, …) return
// null when valid and a message otherwise — exactly what a Flutter
// TextFormField's validator wants.

// ---------------------------------------------------------------------------
// Shared words
// ---------------------------------------------------------------------------

/// zod 4's z.uuid(): RFC 9562 variant, any version 1–8, plus nil and max.
final RegExp uuidPattern = RegExp(
  r'^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}'
  r'|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$',
);

/// zod 4's z.iso.datetime(): UTC with a trailing Z, seconds required.
final RegExp timestampPattern = RegExp(
  r'^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?Z$',
);

/// zod 4's z.iso.date().
final RegExp dayPattern = RegExp(r'^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$');

/// zod 4's z.email() default pattern.
final RegExp emailPattern = RegExp(
  r"^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$",
);

bool isId(String s) => uuidPattern.hasMatch(s);
bool isTimestamp(String s) => timestampPattern.hasMatch(s) && DateTime.tryParse(s) != null;
bool isDay(String s) => dayPattern.hasMatch(s) && DateTime.tryParse(s) != null;

String? validateLat(num? v) => v == null ? 'Required' : (v < -90 || v > 90 ? 'Latitude is between -90 and 90' : null);
String? validateLng(num? v) => v == null ? 'Required' : (v < -180 || v > 180 ? 'Longitude is between -180 and 180' : null);

String? _text(String? v, int min, int max) {
  final t = (v ?? '').trim();
  if (t.length < min) return min == 1 ? 'Required' : 'At least $min characters';
  if (t.length > max) return 'At most $max characters';
  return null;
}

String? _int(int? v, int min, int max) {
  if (v == null) return 'Required';
  if (v < min || v > max) return 'Between $min and $max';
  return null;
}

// The surveyed fields, one rule each (same names as contract.ts).
String? validateStreet(String? v) => _text(v, 1, 120);
String? validateStreetNumber(String? v) => _text(v, 1, 20);
String? validateEntranceName(String? v) => _text(v, 1, 40);
String? validateStories(int? v) => _int(v, 1, 60);
String? validateFlats(int? v) => _int(v, 1, 1000);
String? validateElevators(int? v) => _int(v, 0, 20);
String? validateYearBuilt(int? v) => _int(v, 1800, 2100);
String? validateFreeText(String? v) => (v ?? '').length > 2000 ? 'At most 2000 characters' : null;

// ---------------------------------------------------------------------------
// JSON helpers (strict: wrong type or missing key throws FormatException)
// ---------------------------------------------------------------------------

T _req<T>(Map<String, dynamic> j, String k) {
  if (!j.containsKey(k)) throw FormatException('missing "$k"');
  final v = j[k];
  if (v is! T) throw FormatException('"$k" has the wrong type (${v.runtimeType})');
  return v;
}

T? _opt<T>(Map<String, dynamic> j, String k) {
  if (!j.containsKey(k)) throw FormatException('missing "$k" (send null)');
  final v = j[k];
  if (v == null) return null;
  if (v is! T) throw FormatException('"$k" has the wrong type (${v.runtimeType})');
  return v;
}

int? _optInt(Map<String, dynamic> j, String k) {
  final v = _opt<num>(j, k);
  if (v == null) return null;
  if (v != v.roundToDouble()) throw FormatException('"$k" must be a whole number');
  return v.toInt();
}

E _enum<E extends Enum>(List<E> values, Map<String, dynamic> j, String k) {
  final s = _req<String>(j, k);
  for (final v in values) {
    if (v.name == s) return v;
  }
  throw FormatException('"$k" is not one of ${values.map((v) => v.name).join(' | ')}: "$s"');
}

/// The three columns every entity carries.
abstract class Row {
  Row(this.id, this.createdAt, this.updatedAt);
  final String id;
  final String createdAt;
  final String updatedAt;

  Map<String, dynamic> _rowJson() => {'id': id, 'createdAt': createdAt, 'updatedAt': updatedAt};
}

void _checkRow(Row r, List<String> errors) {
  if (!isId(r.id)) errors.add('id: Invalid UUID');
  if (!isTimestamp(r.createdAt)) errors.add('createdAt: Invalid ISO datetime');
  if (!isTimestamp(r.updatedAt)) errors.add('updatedAt: Invalid ISO datetime');
}

void _check(List<String> errors, String field, String? message) {
  if (message != null) errors.add('$field: $message');
}

void _checkId(List<String> errors, String field, String? v, {bool nullable = false}) {
  if (v == null) {
    if (!nullable) errors.add('$field: Required');
  } else if (!isId(v)) {
    errors.add('$field: Invalid UUID');
  }
}

void _checkTimestamp(List<String> errors, String field, String? v, {bool nullable = false}) {
  if (v == null) {
    if (!nullable) errors.add('$field: Required');
  } else if (!isTimestamp(v)) {
    errors.add('$field: Invalid ISO datetime');
  }
}

// ---------------------------------------------------------------------------
// Enums (the wire value is the enum's name)
// ---------------------------------------------------------------------------

enum Role { admin, field }

enum SurveyStatus { not_started, in_progress, submitted, approved, needs_rework }

/// Statuses that mean "a worker sent a complete survey".
const surveyed = {SurveyStatus.submitted, SurveyStatus.approved, SurveyStatus.needs_rework};

enum UploadState { pending, uploaded, failed }

enum ReviewStatus { pending, approved, retake }

enum CommentScope { building, entrance }

enum StopStatus { todo, done, skipped }

enum ConversationKind { direct, broadcast }

enum SyncState { pending, synced, failed }

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

class User extends Row {
  User({required String id, required String createdAt, required String updatedAt, required this.role, required this.name, required this.email})
      : super(id, createdAt, updatedAt);
  final Role role;
  final String name;
  final String email;

  factory User.fromJson(Map<String, dynamic> j) => User(
        id: _req(j, 'id'), createdAt: _req(j, 'createdAt'), updatedAt: _req(j, 'updatedAt'),
        role: _enum(Role.values, j, 'role'), name: _req(j, 'name'), email: _req(j, 'email'));

  Map<String, dynamic> toJson() => {..._rowJson(), 'role': role.name, 'name': name, 'email': email};
}

List<String> validateUser(User u) {
  final e = <String>[];
  _checkRow(u, e);
  _check(e, 'name', _text(u.name, 1, 100));
  if (!emailPattern.hasMatch(u.email)) e.add('email: Invalid email address');
  return e;
}

class Building extends Row {
  Building({required String id, required String createdAt, required String updatedAt, required this.label, this.comment})
      : super(id, createdAt, updatedAt);
  final String label;
  final String? comment;

  factory Building.fromJson(Map<String, dynamic> j) => Building(
        id: _req(j, 'id'), createdAt: _req(j, 'createdAt'), updatedAt: _req(j, 'updatedAt'),
        label: _req(j, 'label'), comment: _opt(j, 'comment'));

  Map<String, dynamic> toJson() => {..._rowJson(), 'label': label, 'comment': comment};
}

List<String> validateBuilding(Building b) {
  final e = <String>[];
  _checkRow(b, e);
  _check(e, 'label', _text(b.label, 1, 100));
  if (b.comment != null) _check(e, 'comment', validateFreeText(b.comment));
  return e;
}

class Entrance extends Row {
  Entrance({
    required String id,
    required String createdAt,
    required String updatedAt,
    required this.buildingId,
    required this.lat,
    required this.lng,
    required this.street,
    required this.number,
    required this.entranceName,
    this.coordsConfirmed = false,
    this.correctedLat,
    this.correctedLng,
    this.addressConfirmed = false,
    this.stories,
    this.flats,
    this.elevators,
    this.yearBuilt,
    this.groundFloorCommercial,
    this.comment,
    this.surveyStatus = SurveyStatus.not_started,
    this.surveyedBy,
    this.surveyedAt,
  }) : super(id, createdAt, updatedAt);

  final String buildingId;
  final double lat;
  final double lng;
  final String street;
  final String number;
  final String entranceName;
  final bool coordsConfirmed;
  final double? correctedLat;
  final double? correctedLng;
  final bool addressConfirmed;
  final int? stories;
  final int? flats;
  final int? elevators;
  final int? yearBuilt;
  final bool? groundFloorCommercial;
  final String? comment;
  final SurveyStatus surveyStatus;
  final String? surveyedBy;
  final String? surveyedAt;

  factory Entrance.fromJson(Map<String, dynamic> j) => Entrance(
        id: _req(j, 'id'),
        createdAt: _req(j, 'createdAt'),
        updatedAt: _req(j, 'updatedAt'),
        buildingId: _req(j, 'buildingId'),
        lat: _req<num>(j, 'lat').toDouble(),
        lng: _req<num>(j, 'lng').toDouble(),
        street: _req(j, 'street'),
        number: _req(j, 'number'),
        entranceName: _req(j, 'entranceName'),
        coordsConfirmed: _req(j, 'coordsConfirmed'),
        correctedLat: _opt<num>(j, 'correctedLat')?.toDouble(),
        correctedLng: _opt<num>(j, 'correctedLng')?.toDouble(),
        addressConfirmed: _req(j, 'addressConfirmed'),
        stories: _optInt(j, 'stories'),
        flats: _optInt(j, 'flats'),
        elevators: _optInt(j, 'elevators'),
        yearBuilt: _optInt(j, 'yearBuilt'),
        groundFloorCommercial: _opt(j, 'groundFloorCommercial'),
        comment: _opt(j, 'comment'),
        surveyStatus: _enum(SurveyStatus.values, j, 'surveyStatus'),
        surveyedBy: _opt(j, 'surveyedBy'),
        surveyedAt: _opt(j, 'surveyedAt'),
      );

  Map<String, dynamic> toJson() => {
        ..._rowJson(),
        'buildingId': buildingId,
        'lat': lat,
        'lng': lng,
        'street': street,
        'number': number,
        'entranceName': entranceName,
        'coordsConfirmed': coordsConfirmed,
        'correctedLat': correctedLat,
        'correctedLng': correctedLng,
        'addressConfirmed': addressConfirmed,
        'stories': stories,
        'flats': flats,
        'elevators': elevators,
        'yearBuilt': yearBuilt,
        'groundFloorCommercial': groundFloorCommercial,
        'comment': comment,
        'surveyStatus': surveyStatus.name,
        'surveyedBy': surveyedBy,
        'surveyedAt': surveyedAt,
      };

  /// A copy with some fields replaced (pass a value to set it; nullable
  /// fields cannot be cleared through copyWith — build a new Entrance).
  Entrance copyWith({
    String? updatedAt,
    bool? coordsConfirmed,
    double? correctedLat,
    double? correctedLng,
    String? street,
    String? number,
    String? entranceName,
    bool? addressConfirmed,
    int? stories,
    int? flats,
    int? elevators,
    int? yearBuilt,
    bool? groundFloorCommercial,
    String? comment,
    SurveyStatus? surveyStatus,
    String? surveyedBy,
    String? surveyedAt,
  }) =>
      Entrance(
        id: id,
        createdAt: createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        buildingId: buildingId,
        lat: lat,
        lng: lng,
        street: street ?? this.street,
        number: number ?? this.number,
        entranceName: entranceName ?? this.entranceName,
        coordsConfirmed: coordsConfirmed ?? this.coordsConfirmed,
        correctedLat: correctedLat ?? this.correctedLat,
        correctedLng: correctedLng ?? this.correctedLng,
        addressConfirmed: addressConfirmed ?? this.addressConfirmed,
        stories: stories ?? this.stories,
        flats: flats ?? this.flats,
        elevators: elevators ?? this.elevators,
        yearBuilt: yearBuilt ?? this.yearBuilt,
        groundFloorCommercial: groundFloorCommercial ?? this.groundFloorCommercial,
        comment: comment ?? this.comment,
        surveyStatus: surveyStatus ?? this.surveyStatus,
        surveyedBy: surveyedBy ?? this.surveyedBy,
        surveyedAt: surveyedAt ?? this.surveyedAt,
      );
}

/// Rule E1: corrected coordinates come as a pair.
String? validateCorrectedPair(double? lat, double? lng) =>
    (lat == null) != (lng == null) ? 'Corrected latitude and longitude come together' : null;

/// Rule E2: either the office's coordinates fit, or corrected ones are given.
String? validateCoordsChecked(bool coordsConfirmed, double? correctedLat) =>
    !coordsConfirmed && correctedLat == null ? 'Confirm the pin, or enter corrected coordinates' : null;

List<String> validateEntrance(Entrance x) {
  final e = <String>[];
  _checkRow(x, e);
  _checkId(e, 'buildingId', x.buildingId);
  _check(e, 'lat', validateLat(x.lat));
  _check(e, 'lng', validateLng(x.lng));
  _check(e, 'street', validateStreet(x.street));
  _check(e, 'number', validateStreetNumber(x.number));
  _check(e, 'entranceName', validateEntranceName(x.entranceName));
  if (x.correctedLat != null) _check(e, 'correctedLat', validateLat(x.correctedLat));
  if (x.correctedLng != null) _check(e, 'correctedLng', validateLng(x.correctedLng));
  if (x.stories != null) _check(e, 'stories', validateStories(x.stories));
  if (x.flats != null) _check(e, 'flats', validateFlats(x.flats));
  if (x.elevators != null) _check(e, 'elevators', validateElevators(x.elevators));
  if (x.yearBuilt != null) _check(e, 'yearBuilt', validateYearBuilt(x.yearBuilt));
  if (x.comment != null) _check(e, 'comment', validateFreeText(x.comment));
  _checkId(e, 'surveyedBy', x.surveyedBy, nullable: true);
  _checkTimestamp(e, 'surveyedAt', x.surveyedAt, nullable: true);
  _check(e, 'correctedLng', validateCorrectedPair(x.correctedLat, x.correctedLng));
  // Rule E3: a surveyed entrance is complete and says who and when.
  if (surveyed.contains(x.surveyStatus)) {
    _check(e, 'coordsConfirmed', validateCoordsChecked(x.coordsConfirmed, x.correctedLat));
    if (!x.addressConfirmed) e.add('addressConfirmed: Check the address');
    final required = {
      'stories': x.stories,
      'flats': x.flats,
      'elevators': x.elevators,
      'yearBuilt': x.yearBuilt,
      'groundFloorCommercial': x.groundFloorCommercial,
      'surveyedBy': x.surveyedBy,
      'surveyedAt': x.surveyedAt,
    };
    required.forEach((k, v) {
      if (v == null) e.add('$k: Required once the survey is submitted');
    });
  }
  return e;
}

/// What the survey form edits (contract.ts EntranceSurvey): every field
/// required, the same cross-field rules.
List<String> validateEntranceSurvey(Entrance x) {
  final e = <String>[];
  _check(e, 'street', validateStreet(x.street));
  _check(e, 'number', validateStreetNumber(x.number));
  _check(e, 'entranceName', validateEntranceName(x.entranceName));
  if (x.correctedLat != null) _check(e, 'correctedLat', validateLat(x.correctedLat));
  if (x.correctedLng != null) _check(e, 'correctedLng', validateLng(x.correctedLng));
  if (!x.addressConfirmed) e.add('addressConfirmed: Check the address');
  _check(e, 'stories', validateStories(x.stories));
  _check(e, 'flats', validateFlats(x.flats));
  _check(e, 'elevators', validateElevators(x.elevators));
  _check(e, 'yearBuilt', validateYearBuilt(x.yearBuilt));
  if (x.groundFloorCommercial == null) e.add('groundFloorCommercial: Required');
  if (x.comment != null) _check(e, 'comment', validateFreeText(x.comment));
  _check(e, 'correctedLng', validateCorrectedPair(x.correctedLat, x.correctedLng));
  _check(e, 'coordsConfirmed', validateCoordsChecked(x.coordsConfirmed, x.correctedLat));
  return e;
}

class Photo extends Row {
  Photo({
    required String id,
    required String createdAt,
    required String updatedAt,
    required this.entranceId,
    required this.fileName,
    this.remoteUrl,
    required this.takenAt,
    this.lat,
    this.lng,
    this.heading,
    this.uploadState = UploadState.pending,
    this.reviewStatus = ReviewStatus.pending,
    this.reviewNote,
    this.reviewedBy,
    this.replacesPhotoId,
  }) : super(id, createdAt, updatedAt);

  final String entranceId;
  final String fileName;
  final String? remoteUrl;
  final String takenAt;
  final double? lat;
  final double? lng;
  final double? heading;
  final UploadState uploadState;
  final ReviewStatus reviewStatus;
  final String? reviewNote;
  final String? reviewedBy;
  final String? replacesPhotoId;

  factory Photo.fromJson(Map<String, dynamic> j) => Photo(
        id: _req(j, 'id'),
        createdAt: _req(j, 'createdAt'),
        updatedAt: _req(j, 'updatedAt'),
        entranceId: _req(j, 'entranceId'),
        fileName: _req(j, 'fileName'),
        remoteUrl: _opt(j, 'remoteUrl'),
        takenAt: _req(j, 'takenAt'),
        lat: _opt<num>(j, 'lat')?.toDouble(),
        lng: _opt<num>(j, 'lng')?.toDouble(),
        heading: _opt<num>(j, 'heading')?.toDouble(),
        uploadState: _enum(UploadState.values, j, 'uploadState'),
        reviewStatus: _enum(ReviewStatus.values, j, 'reviewStatus'),
        reviewNote: _opt(j, 'reviewNote'),
        reviewedBy: _opt(j, 'reviewedBy'),
        replacesPhotoId: _opt(j, 'replacesPhotoId'),
      );

  Map<String, dynamic> toJson() => {
        ..._rowJson(),
        'entranceId': entranceId,
        'fileName': fileName,
        'remoteUrl': remoteUrl,
        'takenAt': takenAt,
        'lat': lat,
        'lng': lng,
        'heading': heading,
        'uploadState': uploadState.name,
        'reviewStatus': reviewStatus.name,
        'reviewNote': reviewNote,
        'reviewedBy': reviewedBy,
        'replacesPhotoId': replacesPhotoId,
      };
}

List<String> validatePhoto(Photo p) {
  final e = <String>[];
  _checkRow(p, e);
  _checkId(e, 'entranceId', p.entranceId);
  _check(e, 'fileName', _text(p.fileName, 1, 200));
  if (p.remoteUrl != null && Uri.tryParse(p.remoteUrl!)?.hasScheme != true) e.add('remoteUrl: Invalid URL');
  _checkTimestamp(e, 'takenAt', p.takenAt);
  if (p.lat != null) _check(e, 'lat', validateLat(p.lat));
  if (p.lng != null) _check(e, 'lng', validateLng(p.lng));
  if (p.heading != null && (p.heading! < 0 || p.heading! >= 360)) e.add('heading: From 0 up to (not including) 360');
  if (p.reviewNote != null) _check(e, 'reviewNote', validateFreeText(p.reviewNote));
  _checkId(e, 'reviewedBy', p.reviewedBy, nullable: true);
  _checkId(e, 'replacesPhotoId', p.replacesPhotoId, nullable: true);
  // Rule P1: a retake asks why.
  if (p.reviewStatus == ReviewStatus.retake && (p.reviewNote ?? '').isEmpty) {
    e.add('reviewNote: Say why the photo must be retaken');
  }
  // Rule P2: a reviewed photo says who reviewed it.
  if (p.reviewStatus != ReviewStatus.pending && p.reviewedBy == null) {
    e.add('reviewedBy: A reviewed photo names its reviewer');
  }
  return e;
}

class Comment extends Row {
  Comment({required String id, required String createdAt, required String updatedAt, required this.scope, required this.targetId, this.parentId, required this.authorId, required this.text})
      : super(id, createdAt, updatedAt);
  final CommentScope scope;
  final String targetId;
  final String? parentId;
  final String authorId;
  final String text;

  factory Comment.fromJson(Map<String, dynamic> j) => Comment(
        id: _req(j, 'id'), createdAt: _req(j, 'createdAt'), updatedAt: _req(j, 'updatedAt'),
        scope: _enum(CommentScope.values, j, 'scope'), targetId: _req(j, 'targetId'),
        parentId: _opt(j, 'parentId'), authorId: _req(j, 'authorId'), text: _req(j, 'text'));

  Map<String, dynamic> toJson() => {
        ..._rowJson(), 'scope': scope.name, 'targetId': targetId, 'parentId': parentId, 'authorId': authorId, 'text': text};
}

List<String> validateComment(Comment c) {
  final e = <String>[];
  _checkRow(c, e);
  _checkId(e, 'targetId', c.targetId);
  _checkId(e, 'parentId', c.parentId, nullable: true);
  _checkId(e, 'authorId', c.authorId);
  _check(e, 'text', _text(c.text, 1, 2000));
  return e;
}

class Route extends Row {
  Route({required String id, required String createdAt, required String updatedAt, required this.adminId, required this.workerId, required this.date, required this.name})
      : super(id, createdAt, updatedAt);
  final String adminId;
  final String workerId;
  final String date;
  final String name;

  factory Route.fromJson(Map<String, dynamic> j) => Route(
        id: _req(j, 'id'), createdAt: _req(j, 'createdAt'), updatedAt: _req(j, 'updatedAt'),
        adminId: _req(j, 'adminId'), workerId: _req(j, 'workerId'), date: _req(j, 'date'), name: _req(j, 'name'));

  Map<String, dynamic> toJson() => {..._rowJson(), 'adminId': adminId, 'workerId': workerId, 'date': date, 'name': name};
}

List<String> validateRoute(Route r) {
  final e = <String>[];
  _checkRow(r, e);
  _checkId(e, 'adminId', r.adminId);
  _checkId(e, 'workerId', r.workerId);
  if (!isDay(r.date)) e.add('date: Invalid ISO date');
  _check(e, 'name', _text(r.name, 1, 100));
  return e;
}

class RouteStop extends Row {
  RouteStop({required String id, required String createdAt, required String updatedAt, required this.routeId, required this.entranceId, required this.order, this.status = StopStatus.todo})
      : super(id, createdAt, updatedAt);
  final String routeId;
  final String entranceId;
  final int order;
  final StopStatus status;

  factory RouteStop.fromJson(Map<String, dynamic> j) => RouteStop(
        id: _req(j, 'id'), createdAt: _req(j, 'createdAt'), updatedAt: _req(j, 'updatedAt'),
        routeId: _req(j, 'routeId'), entranceId: _req(j, 'entranceId'), order: _optInt(j, 'order') ?? (throw const FormatException('"order" is required')),
        status: _enum(StopStatus.values, j, 'status'));

  Map<String, dynamic> toJson() => {..._rowJson(), 'routeId': routeId, 'entranceId': entranceId, 'order': order, 'status': status.name};
}

List<String> validateRouteStop(RouteStop s) {
  final e = <String>[];
  _checkRow(s, e);
  _checkId(e, 'routeId', s.routeId);
  _checkId(e, 'entranceId', s.entranceId);
  if (s.order < 1) e.add('order: At least 1');
  return e;
}

class TrackingSession extends Row {
  TrackingSession({required String id, required String createdAt, required String updatedAt, required this.workerId, required this.requestedBy, required this.startedAt, this.endedAt})
      : super(id, createdAt, updatedAt);
  final String workerId;
  final String requestedBy;
  final String startedAt;
  final String? endedAt;

  factory TrackingSession.fromJson(Map<String, dynamic> j) => TrackingSession(
        id: _req(j, 'id'), createdAt: _req(j, 'createdAt'), updatedAt: _req(j, 'updatedAt'),
        workerId: _req(j, 'workerId'), requestedBy: _req(j, 'requestedBy'), startedAt: _req(j, 'startedAt'), endedAt: _opt(j, 'endedAt'));

  Map<String, dynamic> toJson() => {..._rowJson(), 'workerId': workerId, 'requestedBy': requestedBy, 'startedAt': startedAt, 'endedAt': endedAt};
}

List<String> validateTrackingSession(TrackingSession t) {
  final e = <String>[];
  _checkRow(t, e);
  _checkId(e, 'workerId', t.workerId);
  _checkId(e, 'requestedBy', t.requestedBy);
  _checkTimestamp(e, 'startedAt', t.startedAt);
  _checkTimestamp(e, 'endedAt', t.endedAt, nullable: true);
  return e;
}

class Position extends Row {
  Position({required String id, required String createdAt, required String updatedAt, required this.sessionId, required this.lat, required this.lng, required this.accuracy, required this.at})
      : super(id, createdAt, updatedAt);
  final String sessionId;
  final double lat;
  final double lng;
  final double accuracy;
  final String at;

  factory Position.fromJson(Map<String, dynamic> j) => Position(
        id: _req(j, 'id'), createdAt: _req(j, 'createdAt'), updatedAt: _req(j, 'updatedAt'),
        sessionId: _req(j, 'sessionId'), lat: _req<num>(j, 'lat').toDouble(), lng: _req<num>(j, 'lng').toDouble(),
        accuracy: _req<num>(j, 'accuracy').toDouble(), at: _req(j, 'at'));

  Map<String, dynamic> toJson() => {..._rowJson(), 'sessionId': sessionId, 'lat': lat, 'lng': lng, 'accuracy': accuracy, 'at': at};
}

List<String> validatePosition(Position p) {
  final e = <String>[];
  _checkRow(p, e);
  _checkId(e, 'sessionId', p.sessionId);
  _check(e, 'lat', validateLat(p.lat));
  _check(e, 'lng', validateLng(p.lng));
  if (p.accuracy < 0) e.add('accuracy: At least 0');
  _checkTimestamp(e, 'at', p.at);
  return e;
}

class Conversation extends Row {
  Conversation({required String id, required String createdAt, required String updatedAt, required this.kind, required this.participantIds})
      : super(id, createdAt, updatedAt);
  final ConversationKind kind;
  final List<String> participantIds;

  factory Conversation.fromJson(Map<String, dynamic> j) => Conversation(
        id: _req(j, 'id'), createdAt: _req(j, 'createdAt'), updatedAt: _req(j, 'updatedAt'),
        kind: _enum(ConversationKind.values, j, 'kind'),
        participantIds: _req<List<dynamic>>(j, 'participantIds').map((v) => v is String ? v : throw const FormatException('"participantIds" holds strings')).toList());

  Map<String, dynamic> toJson() => {..._rowJson(), 'kind': kind.name, 'participantIds': participantIds};
}

List<String> validateConversation(Conversation c) {
  final e = <String>[];
  _checkRow(c, e);
  if (c.participantIds.length < 2) e.add('participantIds: At least 2');
  for (final (i, p) in c.participantIds.indexed) {
    _checkId(e, 'participantIds.$i', p);
  }
  // Rule C1: a direct conversation is exactly two different people.
  if (c.kind == ConversationKind.direct && (c.participantIds.length != 2 || c.participantIds[0] == c.participantIds[1])) {
    e.add('participantIds: A direct conversation has exactly two different people');
  }
  return e;
}

class Message extends Row {
  Message({required String id, required String createdAt, required String updatedAt, required this.conversationId, required this.authorId, required this.text, required this.sentAt, this.readAt = const {}})
      : super(id, createdAt, updatedAt);
  final String conversationId;
  final String authorId;
  final String text;
  final String sentAt;

  /// userId → when that participant read it; the author is never in it.
  final Map<String, String> readAt;

  factory Message.fromJson(Map<String, dynamic> j) => Message(
        id: _req(j, 'id'), createdAt: _req(j, 'createdAt'), updatedAt: _req(j, 'updatedAt'),
        conversationId: _req(j, 'conversationId'), authorId: _req(j, 'authorId'), text: _req(j, 'text'), sentAt: _req(j, 'sentAt'),
        readAt: _req<Map<String, dynamic>>(j, 'readAt').map((k, v) => MapEntry(k, v is String ? v : throw const FormatException('"readAt" values are timestamps'))));

  Map<String, dynamic> toJson() => {..._rowJson(), 'conversationId': conversationId, 'authorId': authorId, 'text': text, 'sentAt': sentAt, 'readAt': readAt};
}

List<String> validateMessage(Message m) {
  final e = <String>[];
  _checkRow(m, e);
  _checkId(e, 'conversationId', m.conversationId);
  _checkId(e, 'authorId', m.authorId);
  _check(e, 'text', _text(m.text, 1, 4000));
  _checkTimestamp(e, 'sentAt', m.sentAt);
  m.readAt.forEach((k, v) {
    _checkId(e, 'readAt', k);
    _checkTimestamp(e, 'readAt.$k', v);
  });
  return e;
}

// ---------------------------------------------------------------------------
// Local-only columns: NEVER ON THE WIRE. The device keeps them next to its
// own copy of a row (week 3 on); a push never sends them.
// ---------------------------------------------------------------------------

class LocalColumns {
  const LocalColumns({this.syncState = SyncState.pending, this.lastError});
  final SyncState syncState;
  final String? lastError;
}

class LocalPhotoColumns extends LocalColumns {
  const LocalPhotoColumns({required this.localUri, super.syncState, super.lastError});
  final String localUri;
}
