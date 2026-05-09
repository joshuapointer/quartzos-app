# Security Policy

## Reporting a Vulnerability

If you discover a security issue in this repository, please open a private security advisory via GitHub:

https://github.com/joshuapointer/quartzos-app/security/advisories/new

We will respond within 5 business days.

## BLE Protocol Notice

This repository contains documentation of the Bluetooth Low Energy (BLE) protocol used to communicate with Dab Rite devices. The protocol itself is documented in [`docs/ble-protocol.md`](../../docs/ble-protocol.md).

**Authentication and authorization are handled entirely by the Dab Rite hardware device.** The app does not store or manage device credentials. Pairing, bonding, and access control occur at the firmware level on the thermometer itself.

## Scope

- **In scope:** Issues in the mobile application code, data storage, or OTA update mechanism.
- **Out of scope:** Physical device firmware, hardware tampering, or BLE sniffing of unencrypted advertisements. These are the responsibility of the device manufacturer.

## Disclosure Policy

We follow responsible disclosure. Once a fix is ready, we will credit the reporter (with permission) in release notes.
