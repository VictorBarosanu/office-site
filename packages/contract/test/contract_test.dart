import 'dart:convert';
import 'dart:io';

import 'package:test/test.dart';

import '../contract.dart';

List<Map<String, dynamic>> load(String name) =>
    (jsonDecode(File('fixtures/$name.json').readAsStringSync()) as List).cast<Map<String, dynamic>>();

void expectValid(List<String> errors, Map<String, dynamic> row) =>
    expect(errors, isEmpty, reason: '${row['id']}');

void main() {
  group('every fixture parses with its schema', () {
    test('users', () {
      for (final j in load('users')) {
        final u = User.fromJson(j);
        expectValid(validateUser(u), j);
        expect(u.toJson(), j);
      }
    });
    test('buildings', () {
      for (final j in load('buildings')) {
        final b = Building.fromJson(j);
        expectValid(validateBuilding(b), j);
        expect(b.toJson(), j);
      }
    });
    test('entrances', () {
      final rows = load('entrances');
      expect(rows.length, 20);
      for (final j in rows) {
        final e = Entrance.fromJson(j);
        expectValid(validateEntrance(e), j);
        expect(e.toJson(), j);
      }
    });
    test('routes and their stops', () {
      final rows = load('routes');
      expect(rows.length, 2);
      for (final j in rows) {
        expectValid(validateRoute(Route.fromJson(j)), j);
        for (final s in (j['stops'] as List).cast<Map<String, dynamic>>()) {
          final stop = RouteStop.fromJson(s);
          expectValid(validateRouteStop(stop), s);
          expect(stop.toJson(), s);
        }
      }
    });
    test('conversations', () {
      for (final j in load('conversations')) {
        final c = Conversation.fromJson(j);
        expectValid(validateConversation(c), j);
        expect(c.toJson(), j);
      }
    });
    test('messages', () {
      for (final j in load('messages')) {
        final m = Message.fromJson(j);
        expectValid(validateMessage(m), j);
        expect(m.toJson(), j);
      }
    });
  });

  group('a wrong one is refused', () {
    test('wrong-entrance.json breaks eleven rules', () {
      final j = jsonDecode(File('test/wrong-entrance.json').readAsStringSync()) as Map<String, dynamic>;
      final errors = validateEntrance(Entrance.fromJson(j));
      final fields = errors.map((e) => e.split(':').first).toSet().toList()..sort();
      // the same list test/contract.test.ts expects from zod
      expect(fields, [
        'addressConfirmed',
        'correctedLng',
        'elevators',
        'flats',
        'groundFloorCommercial',
        'id',
        'stories',
        'surveyedAt',
        'surveyedBy',
        'updatedAt',
        'yearBuilt',
      ]);
    });
    test('an unknown status is refused by fromJson', () {
      final j = load('entrances').first..['surveyStatus'] = 'done';
      expect(() => Entrance.fromJson(j), throwsFormatException);
    });
    test('a direct conversation with three people', () {
      final j = load('conversations').first;
      final c = Conversation.fromJson(j);
      final bad = Conversation(
          id: c.id, createdAt: c.createdAt, updatedAt: c.updatedAt, kind: c.kind,
          participantIds: [...c.participantIds, '6f1c2a51-0d5e-4b8e-9a51-3c2b1f0e9d77']);
      expect(validateConversation(bad), isNotEmpty);
    });
    test('an incomplete survey lists the missing fields', () {
      final e = Entrance.fromJson(load('entrances')[1]);
      final fields = validateEntranceSurvey(e).map((x) => x.split(':').first).toSet().toList()..sort();
      expect(fields, ['addressConfirmed', 'coordsConfirmed', 'elevators', 'flats', 'groundFloorCommercial', 'stories', 'yearBuilt']);
    });
  });
}
