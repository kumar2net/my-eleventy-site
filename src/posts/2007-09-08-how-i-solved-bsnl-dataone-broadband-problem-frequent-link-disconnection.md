---
layout: post.njk
title: How I solved BSNL Dataone Broadband problem - Frequent Link disconnection
date: 2007-09-08T17:48:35.000Z
tags: ["post","bsnl-broadband","bsnl-broadband-issues","dataone"]
categories: ["bsnl-broadband"]
---

I had frequent problem last week of ADSL Link in my modem/Router (Huawei MT-882) going down. The Link Led will turn green (Link Disconnection) from Orange (Link good) and this cycle will repeat every few minute

s. Repeated calls to BSNL call center - 1 800 424 1600 got me the following answer - Sir, if you are able to talk to me using the same telephone link which is connected to your ADSL modem means there is no problem in the cable and it should wor

k. Similar point-of-view was also expressed by their JE/JTO from the exchang

e. I did my troubleshooting by logging in to the modem and figured out that the SNR- Signal-to-Noise Ratio has gone down to 5 dB from the earlier > 30 dB, both on the uplink as well as the downlin

k. I went down to the ground floor of my building where the BSNL Distribution Box was located, identified my cable pair, cleaned the cable with knife blade (noticed that the cable lead was totally rusted) till I could see the colour of Copper in the cable and wrap'd a Electrical Insulation tape (Steelgrip tape) on each of the lead

s. I came back up, switched ON the modem, the SNR got back to > 30 dB (Please refer to the snapshot of the DSL router stat page) and I am living Happily ever afte

r. Moral of the story: Phone communication uses Low frequency so we may get acceptable speech quality even with BAD physical connections, but for Broadband ADSL which uses the High frequency tones, good physical connection is an absolute mus

t. > *Note: An image that was originally here (Snapshot of ADSL modem - Huawei MT 882) is no longer availabl

e. *)
