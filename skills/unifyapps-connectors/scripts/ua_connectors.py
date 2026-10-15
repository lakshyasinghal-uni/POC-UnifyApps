#!/usr/bin/env python3
"""
Harvest the UnifyApps connector catalogue from a terminal, for LOCAL (non-SSO) accounts.

SSO accounts cannot log in this way - use scripts/harvest.js in a signed-in browser instead.

No credentials live in this file. You supply your own account through the environment and the
password is prompted for with hidden input; it is never echoed, logged, written to disk or passed
as an argument.

    export UA_BASE_URL=https://orbit.uat.unifyapps.com
    export UA_USERNAME=<your local username>
    export UA_IDP_ID=<the tenant's local identityProviderId>     # UAT is filled in below
    python ua_connectors.py > snapshot.tsv

    python refresh_catalogue.py snapshot.tsv

Options (environment):
    UA_DEEP=connected   probe connection + resource counts for connectors that have a connection
                        (the default, ~300 connectors)
    UA_DEEP=none        catalogue only, no probing
    UA_DEEP=all         probe every connector - slow, avoid on a shared tenant

Standard library only, Python 3.8+.
"""

import getpass
import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = os.environ.get("UA_BASE_URL", "https://orbit.uat.unifyapps.com").rstrip("/")
USERNAME = os.environ.get("UA_USERNAME", "")
# The local-login provider id is tenant-wide and not a secret; it differs per tenant.
KNOWN_IDP_IDS = {"https://orbit.uat.unifyapps.com": "65d2f4cf672d16da08efc3d0"}
IDP_ID = os.environ.get("UA_IDP_ID") or KNOWN_IDP_IDS.get(BASE, "")
DEEP = os.environ.get("UA_DEEP", "connected")

if not USERNAME or not IDP_ID:
    sys.exit("Set UA_USERNAME (and UA_IDP_ID on tenants other than UAT) to your own local "
             "UnifyApps account. No account is built in. SSO accounts must use harvest.js.")

_jar = http.cookiejar.CookieJar()
_opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(_jar))


def call(method, path, body=None, base=None):
    url = (base or BASE) + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Accept", "application/json")
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with _opener.open(req, timeout=90) as resp:
            raw = resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:
        raise SystemExit("HTTP %s on %s %s: %s"
                         % (exc.code, method, path, exc.read().decode("utf-8", "replace")[:300]))
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except ValueError:
        raise SystemExit("Non-JSON response from %s - session expired? Sign in again." % path)


def login():
    # Password is prompted for, never stored. Note /auth/, not /api/.
    password = os.environ.get("UA_PASSWORD") or getpass.getpass("Password for %s: " % USERNAME)
    if not password:
        sys.exit("No password supplied.")
    call("POST", "/auth/workflow/execute/node?name=emailAndPassLoginRequest",
         {"inputs": {"username": USERNAME, "password": password,
                     "identityProviderId": IDP_ID}})
    del password
    me = call("GET", "/api/user-context?includeRoles=true")
    print("# signed in as %s" % (me.get("email") or me.get("name") or USERNAME), file=sys.stderr)


def kind_of(node):
    if node.get("custom"):
        return "custom"
    return "internal" if "Internal" in (node.get("tags") or []) else "app"


def main():
    login()

    cat = call("GET", "/api/workflow-builder/nodes"
                      "?fields=name,displayName,tags,type,needsAuthentication,custom,hidden")
    nodes = cat.get("objects", [])
    print("# %d nodes" % len(nodes), file=sys.stderr)

    wc = call("GET", "/api/workflow-builder/find-nodes-with-connections?fields=name")
    rows_wc = wc if isinstance(wc, list) else wc.get("objects", [])
    connected = {n["name"] for n in rows_wc}

    if DEEP == "all":
        probe = nodes
    elif DEEP == "connected":
        probe = [n for n in nodes if n["name"] in connected]
    else:
        probe = []

    counts = {}
    for i, node in enumerate(probe, 1):
        name = node["name"]
        agg = call("POST", "/api/aggregation?entityType=Connection&group=STANDARD",
                   {"entityType": "Connection", "group": "STANDARD", "includeTotalHits": True,
                    "filter": {"op": "AND", "values": [
                        {"field": "appName", "op": "EQUAL", "values": [name]}]},
                    "projections": [{"name": "id"}],
                    "sorts": [{"field": "cTm", "order": "DESC"}],
                    "page": {"limit": 1, "offset": 0}})
        res = call("GET", "/api/workflow-builder/node/%s/resources" % urllib.parse.quote(name))
        counts[name] = (agg.get("totalHits", ""), len(res.get("objects", [])))
        if i % 25 == 0:
            print("# probed %d/%d" % (i, len(probe)), file=sys.stderr)

    rank = {"app": 0, "internal": 1, "custom": 2}
    nodes.sort(key=lambda n: (rank[kind_of(n)], n["name"]))

    import datetime
    print("# unifyapps connector snapshot")
    print("# tenant\t%s" % BASE)
    print("# date\t%s" % datetime.date.today().isoformat())
    print("# appName\tdisplayName\tkind\tconnections\tresources")
    for n in nodes:
        c, a = counts.get(n["name"], ("", ""))
        print("%s\t%s\t%s\t%s\t%s" % (n["name"], n.get("displayName", ""), kind_of(n), c, a))


if __name__ == "__main__":
    main()
