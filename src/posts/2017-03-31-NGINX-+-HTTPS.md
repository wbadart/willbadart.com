---
title: NGINX + HTTPS
tags:
  - security
  - tutorial
  - web
published: 2017-03-31 01:44:52
---


Below is a long-winded exposition of my recent sysadmin tribulations. To cut to the chase (the tutorial on configuring NGINX with HTTPS), please follow [this anchor](#tutorial).

<!-- MORE -->

Some of you more vigilant readers may have noticed this week that the blog was down for a few days. This was because of the adventure I was having with [iRedMail](http://iredmail.org) and with HTTPS.

## Genesis

It all began when I started toying around with *iRedMail*, which is open source email software, for a project for my ethics class (I was originally going to spin up a [Nextcloud](https://nextcloud.com) server on an old computer at home, but didn't finish before spring break ended).

iRedMail requires (or at least, **strongly** recommends) a fresh server for installation. And so, I backed up the blog (but cleverly didn't delete the `node_modules` folder so that it would take 5 times longer than it needed to), terminated the old t2.nano and spun up a new one.

What happened next was a moderately long, boring, and partially successful string of installation attempts. At the end of these, I had a "working" mail server, MX records and a couple new A records on `wbadart.info`, and not one but **two** web mail clients (one of them was, I guess the default, and the other, much shinier one, was called "[SOGo](https://sogo.nu)"). But I still couldn't receive mail. Trying to send a message to the new `postmaster` account from my Notre Dame gmail resulted in a series of Delivery Status Notifications from gmail, each separated by about 6 hours, and each reporting some new quirk in my new setup.

All the while, inside the web clients, my browser kept bugging me about some pesky self-signed HTTPS certificates...

## Chapter 2: HTTPS

Those notifications were really annoying, so I started reading up on how to silence them (preferably by using real certificates and not by disabling the security notifications).

After reading around for a while, I found that I could get real, free certificates from [Let's Encrypt](https://letsencrypt.org), a non-profit that supports Internet privacy and security. Moreover, I could use their handy little CLI to install and renew certificates. **Moreover** I found an interface to that interface called [bubbly](https://github.com/eustasy/bubbly) that would plug my new certificates straight into the NGINX config.

Wonderful.

![Certbot logo](./assets/certbot.jpg)

Too good to be true, right? Right. You may have noticed earlier that I'm running a t2.nano for a server. That's the wimpiest EC2 category, *smaller than what's offered in the free tier*. And it turns out my poor baby couldn't handle generating Diffie Hellman parameters with 4096 bit primes (a necessary step according to the bubbly installer).

I lost responsiveness, and soon my SSH connection was closed. I hoped that perhaps, since I'd been running the installer in a tmux session, that it would continue while I was disconnected. While trying to reconnect, I threw my whole networks diagnostics toolbox at it: ping, nmap, curl, whatever. Totally dead to the world.

In my naïve hope that `openssl` was still running in my tmux session, I let the machine be overnight.

The next day, there was still no pulse, so I rebooted the server. At the same time, I started generating the parameters locally so that I could securely transfer them later (to give you an idea about how wimpy the t2.nano is, this "local computer" I used is an 2009 Asus EEE netbook, that, even though it took a full 2 hours to generate the parameters, was still able to responsively run a number of other, *graphical* programs simultaneously).

---

At this point I decided to give iRedMail a rest and just see if I could get NGINX going with HTTPS for the blog.

A couple days of tears and troubleshooting, culminating in an extremely helpful conversation with the EFF's [`certbot`](https://certbot.eff.org) devs on IRC, are condensed into the tutorial below. Please enjoy.

## Tutorial

In case you were wondering, I'm using subheaders instead of a numbered list for the steps because, as I found out in the [last tutorial](https://blog.wbadart.info/2017/02/03/Multiple-Web-Servers-on-a-Single-Box-with-Nginx), ordered lists aren't very flexible in Markdown. Also, this way lets you anchor to specific steps, in case you wanted to share a link to a specific step with one of your friends.

### Zero - acquire domain name

If you don't already have one, you're going to need it now. It's a good investment to buy a domain name that's related to your name; it's good for building that personal brand. I do all of my domain management through [GoDaddy](https://godaddy.com) and can't complain. In fact, their interface for domain name management recently got a sleek update.

### One - install materials

If `nginx` is in your system's package manager's default repositories, you know what to do. Otherwise, [here](http://nginx.org/en/download.html) is the download page. If you did the previous tutorial about the `proxy_pass`, this step is already done.

Next you're going to want to install `certbot`. The [homepage](https://certbot.eff.org) will walk you through downloading and installing.

Just so we're on the same page, this is all happening on your remote webserver.

### Two - get those certificates

```shell
certbot certonly --webroot -w /var/www/html -d domain.com -d www.domain.com
```

Let's deconstruct that.

- The `certonly` "subcommand" is used to fetch, but not install a certificate.

- The `--webroot` flag specifies "webroot" mode, and `-w /var/www/html` specifies the actual location of the webroot. If you were feeling adventurous, you might try excluding this, as my certificates aren't installed to `/var/www/html`, and in fact, this blog isn't even served out of there.

- Finally, each `-d DOMAIN` adds a domain name to be covered by the certificate. This includes any subdomains (e.g., when I ran this command, I used `-d wbadart.info -d blog.wbadart.info`).

You'll be taken through a pretty straight forward prompt, and will end up with some new files populating `/etc/letsencrypt`.

### Three - tell NGINX to use the certs

The setup I recommend you use is laid out like this:

You have one main HTTPS server which includes virtual hosts for each service running off this host. Each of these virtual hosts will spin up two virtual servers, an HTTPS one (the "real" one) and an HTTP one (which just redirects to HTTPS). With this arrangement, any new virtual host will **automatically** be imbued with that sweet sweet SSL goodness. Just make sure to update your certs to include the `server_name`, e.g. I recently added `cloud.wbadart.info` so I ran the command

```shell
certbot certonly --webroot -w /var/www/html \
  -d wbadart.info \
  -d blog.wbadart.info \
  -d cloud.wbadart.info
```

Open up your main NGINX configuration at `/etc/nginx/nginx.conf` and add the following lines to the `http` block, probably right below `ssl_prefer_server_ciphers`:

```nginx
ssl_certificate /etc/letsencrypt/live/mydomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/mydomain.com/privkey.pem;
```

### Four - test and reload configuration

To test and run, execute the following. If the test fails, it will tell you exactly which line you need to fix.

```shell
sudo nginx -t
sudo service nginx reload
```

### Five - adding a site/ profit

For the purposes of this example, the first HTTPS-enabled server we'll be creating is a simple static file server. Add the following to the new file:

```nginx
# /etc/nginx/sites-enabled/example.conf
server {
    listen 80;
    listen [::]:80;
    server_name mydomain.com;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name mydomain.com;
    root /var/www/html;
}
```

Now simple drop some random `index.html` into `/var/www/html` and visit `mydomain.com`! If you get a 403 or something along those lines, try

```shell
chown -R www-data:www-data /var/www/html
```

Also you'll need to test and reload your configuration (see [step 4](#Four-test-and-reload-configuration)).

Try visiting it by explicitly entering `http://mydomain.com` in the address bar to see that redirect in action.

### Extras

Now that you've got the basics set up, you can continue to add sites by adding new configs to `sites-enabled/`, following the example above (again, if there's a new domain/ `server_name` involved, you'll need to renew your certs, which you can only do so often). Don't forget about the `proxy_pass` from the last tutorial for some more tips and tricks.

If you visit [ssllabs.com](https://ssllabs.com), they will rate, essentially, the quality of your secure connection. I've you've followed the steps above, you'll likely be capped at a **B**, since the default configuration allows for weak Diffie-Hellman parameters. To fix this, do:

```shell
openssl dhparams -out ./dhparam.pem 4096
```

Be warned, this will take a while. Most sources will report at least 15 minutes, my dinky netbook took two hours. Once the parameters are generated, add the following line to `/etc/nginx/nginx.conf` below `ssl_certificate_key`:

```nginx
ssl_dhparam /path/to/dhparam.pem
```

And that should set you up!


### Addendum

If you install your certificates using the instructions above, the following should correctly renew your certificates when the time comes (after 90 days):

```shell
sudo certbot certonly --force-renewal \
  -d domain.com \
  -d other.domain.com
```

Where you enter `-d domain` for all the domains and subdomains that are covered by the certificate.
