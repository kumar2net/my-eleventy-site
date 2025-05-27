---
layout: "post.njk"
title: "iPhone 3GS connectivity issue with BSNL Broadband"
date: "2010-09-30T21:08:27.000Z"
permalink: "/2010/09/30/iphone-3gs-connectivity-issue-with-bsnl-broadband/"
categories: ["BSNL Broadband", "iphone 3gs", "teracom", "type 2 modem", "Wi-Fi", "WPA"]
---

I was involved in remote troubleshooting of  iPhone NOT connecting to the newly installed BSNL Router (Type 2 ADSL modem in BSNL parlance, make - Teracom) while the laptop would connect instantly. The following worked:
<ul>
	<li>configured wireless settings for WPA - mixed mode with passphrase (instead of WEP 64 bit key, as done by the BSNL technician)</li>
	<li>WPA and WPA2 encryption protocols are newer, more effective security options for wireless networks than the older WEP protocol and hence the new generation devices work better with it.</li>
</ul>
