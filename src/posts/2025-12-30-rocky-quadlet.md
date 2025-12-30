---
title: In praise of Rocky Linux + Quadlet
published: 2025-12-30 09:00Z-0700MST
tags:
- linux
---

Inside me there are two wolves: a Purist and a Pragmatist.

The Purist has an eye for the Right Way to do things, for solid foundations, and for
beautiful abstractions. As I get older, though, I hear the Pragmatist speaking up more
and more. The Pragmatist feels no moral distress doing things Not the Right Way if it
means getting real results.

With this framing in mind, let's study my little utility server.

For many years, I've found it _very_ useful to have an always-on machine sitting
somewhere on a VPN with my phone and workstation. This has sometimes been a Raspberry
Pi, sometimes the cheapest VPC I can find, but always a laboratory for experimenting
with different operating systems and infrastructure tooling.

The Purist is a fan of immutable operating systems, and an even bigger fan of
declarative ones, so in the early years, this server variously ran [NixOS], [CoreOS],
diskless [Alpine Linux], and at one point even [OpenBSD] with my own [Vultr-based IaC
provider][infra] I rolled in Haskell.

[NixOS]: https://nixos.org/
[CoreOS]: https://fedoraproject.org/coreos/
[Alpine Linux]: https://wiki.alpinelinux.org/wiki/Diskless_Mode
[OpenBSD]: https://www.openbsd.org/
[infra]: https://github.com/wbadart/infra

These systems were all _extremely_ reliable. It was trivial to audit changes and
redeploy if ever needed. **However**, they all added friction to experimenting with new
software&mdash;one of the foundational purposes of the server. For one, they all
involved a somewhat expensive build process. Moreover, it wasn't always easy to
translate setup instructions written for conventional, mutable systems.

Can I have my cake and eat it too? Can I have rock-solid declarative system management
in an environment that supports imperative experimentation?

## Yes: enter Quadlet

One pattern I settled into was to create a folder for each application I wanted to run,
write a `docker-compose.yml` file to configure it, and wrap it all in a systemd unit
that generally looked like:

```systemd
[Unit]
Description=Some Application
Requires=docker.service
After=docker.service

[Service]
Type=simple
WorkingDirectory=/opt/some_application
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

This worked pretty well&mdash;certainly better than `nohup docker-compose up` or leaving
things running in a `tmux` session. But I found it to be a little clunky.

As it so happens, the team behind [Podman] has been working on a systemd integration
which they call [Quadlet].

[Podman]: https://podman.io/
[Quadlet]: https://docs.podman.io/en/latest/markdown/podman-quadlet.1.html

Quadlet defines a couple of new systemd unit types that roughly correspond to the
sections of a Docker Compose file: containers, volumes, networks, etc. On startup,
Quadlet generates regular units that systemd can natively understand, and which take
care of all the container wrangling. Of course they also support the typical process
management stuff you'd expect in a systemd service unit.

If you drop these unit files into `/etc/containers/systemd`, Quadlet and systemd work
together to deliver a lovely hands-free, automatic, **declarative** experience.

It seems like you can get this experience out-of-the-box from any Red Hat -adjacent
distro, but I've had the best experience with it in [Rocky Linux]. Rocky has first-class
Quadlet support (I've had small issues with Fedora), but still allows you to drop down
into conventional, imperative system management (unlike CoreOS).

[Rocky Linux]: https://rockylinux.org/

Ultimately, Rocky + Quadlet is a great compromise for the Purist and the Pragmatist: I
get a dependable, declarative foundation for the services I rely on, in an environment
that encourages interactive tinkering. *Hats* off to the Podman team!
