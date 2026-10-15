#!/usr/bin/env python3
"""
Diff a fresh connector snapshot against the shipped catalogue, then merge it.

This is the "keep learning" half of the unifyapps-connectors skill. Run it after harvesting a
snapshot with scripts/harvest.js (browser) or scripts/ua_connectors.py (terminal).

    python refresh_catalogue.py snapshot.tsv              # report, merge, changelog
    python refresh_catalogue.py snapshot.tsv --dry-run    # report only
    python refresh_catalogue.py snapshot.tsv --catalogue /path/to/catalogue

Snapshot format (tab separated, '#' lines are provenance comments):

    # tenant<TAB>https://orbit.uat.unifyapps.com
    # date<TAB>2026-09-23
    appName<TAB>displayName<TAB>kind<TAB>connections<TAB>resources

kind is one of: app | internal | custom.

What it writes
    connectors-index.tsv        built-in application connectors (kind=app)
    platform-nodes.tsv          built-in platform nodes         (kind=internal)
    connections-<tenant>-<date>.tsv   connectors that have connections, with counts
    CHANGELOG.md                one dated entry per refresh

Custom connectors are tenant-local, so they are reported and snapshotted but never merged into
the shipped index.

No credentials, no network access: this script only reads and writes local files.
"""

import argparse
import datetime as _dt
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CATALOGUE = os.path.normpath(os.path.join(HERE, os.pardir, "catalogue"))

INDEX = "connectors-index.tsv"
PLATFORM = "platform-nodes.tsv"
CHANGELOG = "CHANGELOG.md"


def read_snapshot(path):
    """-> (meta dict, {appName: {displayName, kind, connections, resources}})."""
    meta, rows = {}, {}
    with open(path, encoding="utf-8") as fh:
        for raw in fh:
            line = raw.rstrip("\n")
            if not line.strip():
                continue
            if line.startswith("#"):
                parts = line.lstrip("#").strip().split("\t")
                if len(parts) == 2 and parts[0] in ("tenant", "date"):
                    meta[parts[0]] = parts[1]
                continue
            cols = line.split("\t")
            if len(cols) < 3:
                sys.exit("Malformed row (need at least 3 columns): %r" % line)
            name, display, kind = cols[0], cols[1], cols[2]
            rows[name] = {
                "displayName": display,
                "kind": kind,
                "connections": cols[3] if len(cols) > 3 else "",
                "resources": cols[4] if len(cols) > 4 else "",
            }
    if not rows:
        sys.exit("Snapshot %s contained no rows." % path)
    return meta, rows


def read_catalogue_file(path):
    """-> {appName: displayName}. Missing file is an empty catalogue, not an error."""
    out = {}
    if not os.path.exists(path):
        return out
    with open(path, encoding="utf-8") as fh:
        for raw in fh:
            line = raw.rstrip("\n")
            if not line.strip() or line.startswith("#"):
                continue
            cols = line.split("\t")
            out[cols[0]] = cols[1] if len(cols) > 1 else ""
    return out


def write_catalogue_file(path, mapping, title):
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("# %s\n# appName\tdisplayName\n" % title)
        for name in sorted(mapping):
            fh.write("%s\t%s\n" % (name, mapping[name]))


def diff(old, new):
    added = sorted(k for k in new if k not in old)
    removed = sorted(k for k in old if k not in new)
    renamed = sorted(k for k in new if k in old and old[k] and new[k] != old[k])
    return added, removed, renamed


def section(title, names, new, old=None):
    if not names:
        return []
    out = ["", "%s (%d)" % (title, len(names)), ""]
    for n in names:
        if old is not None:
            out.append("  %-42s %s  ->  %s" % (n, old[n], new[n]))
        else:
            out.append("  %-42s %s" % (n, new.get(n, "")))
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("snapshot", help="TSV produced by harvest.js or ua_connectors.py")
    ap.add_argument("--catalogue", default=DEFAULT_CATALOGUE,
                    help="catalogue directory (default: the skill's own)")
    ap.add_argument("--dry-run", action="store_true", help="report without writing anything")
    args = ap.parse_args()

    meta, rows = read_snapshot(args.snapshot)
    tenant = meta.get("tenant", "unknown-tenant")
    date = meta.get("date", _dt.date.today().isoformat())
    short_tenant = tenant.replace("https://", "").split(".")[0] or "tenant"

    cat = args.catalogue
    os.makedirs(cat, exist_ok=True)

    new_apps = {k: v["displayName"] for k, v in rows.items() if v["kind"] == "app"}
    new_internal = {k: v["displayName"] for k, v in rows.items() if v["kind"] == "internal"}
    customs = {k: v for k, v in rows.items() if v["kind"] == "custom"}

    old_apps = read_catalogue_file(os.path.join(cat, INDEX))
    old_internal = read_catalogue_file(os.path.join(cat, PLATFORM))

    a_add, a_rem, a_ren = diff(old_apps, new_apps)
    i_add, i_rem, i_ren = diff(old_internal, new_internal)

    report = []
    report.append("UnifyApps connector refresh")
    report.append("  tenant    %s" % tenant)
    report.append("  date      %s" % date)
    report.append("  snapshot  %d application  %d platform  %d custom"
                  % (len(new_apps), len(new_internal), len(customs)))
    report.append("  catalogue %d application  %d platform (before)"
                  % (len(old_apps), len(old_internal)))
    report += section("NEW application connectors", a_add, new_apps)
    report += section("REMOVED application connectors", a_rem, old_apps)
    report += section("RENAMED application connectors", a_ren, new_apps, old_apps)
    report += section("NEW platform nodes", i_add, new_internal)
    report += section("REMOVED platform nodes", i_rem, old_internal)
    report += section("RENAMED platform nodes", i_ren, new_internal, old_internal)
    if customs:
        report += ["", "Custom connectors in this tenant (%d, not merged into the index)"
                   % len(customs), ""]
        for n in sorted(customs, key=lambda k: customs[k]["displayName"].lower()):
            report.append("  %-42s %s" % (n, customs[n]["displayName"]))
    changed = any([a_add, a_rem, a_ren, i_add, i_rem, i_ren])
    if not changed:
        report += ["", "No change to the built-in catalogue."]
    print("\n".join(report))

    if args.dry_run:
        print("\n(dry run - nothing written)")
        return

    write_catalogue_file(os.path.join(cat, INDEX), new_apps,
                         "UnifyApps application connectors - %s, %s" % (tenant, date))
    write_catalogue_file(os.path.join(cat, PLATFORM), new_internal,
                         "UnifyApps built-in platform nodes - %s, %s" % (tenant, date))

    # Snapshot of what actually has connections, kept per tenant+date rather than overwritten.
    connected = {k: v for k, v in rows.items() if v["connections"] not in ("", "0")}
    if connected:
        snap = os.path.join(cat, "connections-%s-%s.tsv" % (short_tenant, date))
        with open(snap, "w", encoding="utf-8", newline="\n") as fh:
            fh.write("# connections per connector - %s, %s\n" % (tenant, date))
            fh.write("# appName\tdisplayName\tconnections\tresources\n")
            for n in sorted(connected, key=lambda k: -int(connected[k]["connections"] or 0)):
                v = connected[n]
                fh.write("%s\t%s\t%s\t%s\n"
                         % (n, v["displayName"], v["connections"], v["resources"]))
        print("\nwrote %s" % os.path.relpath(snap, cat))

    entry = ["", "## %s - %s" % (date, tenant), "",
             "%d application connectors, %d platform nodes, %d custom."
             % (len(new_apps), len(new_internal), len(customs))]
    for label, names, src in (("Added", a_add, new_apps), ("Removed", a_rem, old_apps),
                              ("Renamed", a_ren, new_apps),
                              ("Added (platform)", i_add, new_internal),
                              ("Removed (platform)", i_rem, old_internal)):
        if names:
            entry.append("")
            entry.append("**%s (%d):** %s" % (label, len(names),
                         ", ".join("`%s` %s" % (n, src.get(n, "")) for n in names)))
    if not changed:
        entry += ["", "No change to the built-in catalogue."]
    entry.append("")

    changelog = os.path.join(cat, CHANGELOG)
    if not os.path.exists(changelog):
        with open(changelog, "w", encoding="utf-8", newline="\n") as fh:
            fh.write("# Connector catalogue changelog\n\n"
                     "One entry per refresh. Newest entries are appended at the end.\n")
    with open(changelog, "a", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(entry) + "\n")

    print("wrote %s, %s, %s" % (INDEX, PLATFORM, CHANGELOG))
    if a_add or i_add:
        print("\nNext: for each new connector that matters, pull "
              "GET /api/workflow-builder/node/<appName>/resources and write "
              "catalogue/actions/<appName>.md")


if __name__ == "__main__":
    main()
