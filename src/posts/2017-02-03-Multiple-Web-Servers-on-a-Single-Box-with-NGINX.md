---
title: Multiple Web Servers on a Single Box with NGINX
tags:
  - tutorial
  - web
published: 2017-02-03 05:53:54
---


I wanted to take a quick break from our normal programming to share with you a nifty little feature of [NGINX](https://www.nginx.com/) I recently learned about. If you're here for my next ethics post, you'll have to wait for another couple days.

<!-- MORE -->

## End goal

As I hinted at in the title, we're going to use NGINX to host "as many websites as you want" on a single machine. I'm not just talking about static file servers, but any arbitrary web servers on the internet (though we'll be focusing strictly on local servers). Our configuration will specify which of a number of servers will handle a request based on the domain of that incoming request. I've been looking for a simple and effective way to do this for some time now, since I'm on way too strict a budget for a second [EC2 instance](https://aws.amazon.com/ec2/). At first I thought I'd find my solution in [virtual hosting](https://en.wikipedia.org/wiki/Virtual_hosting) (virtual hosts are known in NGINX speak as "[server blocks](https://www.nginx.com/resources/wiki/start/topics/examples/server_blocks/)"). It turns out, however, that my knight in shining armor was the [reverse proxy](https://www.nginx.com/resources/glossary/reverse-proxy-server/).

**A word of warning:** This isn't a great fix for high-traffic sites, as *all* requests for *all* of your websites are going to be hitting the same metal. I'm "lucky" enough that with the traffic on my sites, this isn't really an issue for me.

## The solution

My server is an Amazon EC2 t2-micro with Ubuntu 16.04.1, so for non-Debian people, just swap in your own package manager/ appropriate command where needed.

0. **Step 0:** The NGINX service will want to start as soon as it's installed, and it will take over port 80 to do this. As a result, you'll need to kill any process already bound to port 80 (use `netstat -pntl` for this. If root owns the process, you'll need to `sudo` in order to see the pid). *The installation will fail if the NGINX service is unable to start.*
1. **Step 1:** Install NGINX. NGINX conveniently already lives in the default Ubuntu package repositories, so (logged into your server of course) give 'er the old `sudo apt install nginx`. (I've found that before undertaking projects like these, `apt update` never did any harm, so you could run that first if you like.)
2. **Step 2:** Start the server for your first site. If you're just trying this for fun and don't already have a server going (and you already have [node](https://nodejs.org) installed), the [ExpressJS hello world app](http://expressjs.com/en/starter/hello-world.html) would be a good starting point. Make sure it's running before moving on.
3. **Step 3:** Configure your **first reverse proxy**. Woohoo.
    ```
    me@server:~$ cd /etc/nginx/sites-enabled
    me@server:sites-enabled$ $EDITOR mysite.conf  # you're almost certainly going to need sudo here
    ```
    Enter the following into your now open `mysite.conf`:
    ```
    server {
        listen 80;
        server_name thedomainthatiown.com;
        location / {
            proxy_pass http://localhost:3000;
        }
    }
    ```
    I realize now that I forgot to mention: you're going to want to acquire a domain name. If all you have is the IP address of your machine, NGINX won't have anything do differentiate requests by. Don't worry, obscure domains are dirt cheap, and you can ususally create as many subdomains as you want with them.
    Also, check out the NGINX docs. There's a lot of nifty stuff you can include in these configuration files to optimize caching, compression, and more. I've omitted those options here for the sake of brevity.
4. **Step 4:** Tell NGINX to reload its configuration: `sudo service nginx reload`. This will have NGINX maintain any open connections with the current configuration, but load the new one for all subsequent requests.
5. **Step 5:** Start up your next server process. Again, if you need some inspiration, I say look no farther than the Express starter app (just make sure it binds to a different port from your other server).
6. **Step 6:** Add a configuration file for the new server. It will basically be identical to the first one, except the value of `server_name` should be a second domain name (or a subdomain of the first) and the value of `proxy_pass` should reflect the port binding of the new server. To be clear, the new server should get its own configuration file in the `sites-enabled` directory.
7. **Step 7:** *Profit.* If you're like me and created a subdomain just for the purpose of this exercise, and it's not working, just give it a sec, your TTL might be a little high.

And that's all she wrote. Whenever you want to add a site, repeat steps 2 and 3 and you'll be on your way!
