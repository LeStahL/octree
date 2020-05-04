/* Discombobulated Mondrian Cube
 * Found inspiration here: https://scontent-frt3-1.xx.fbcdn.net/v/t1.0-9/p960x960/95431173_10218958939858393_4778977915184349184_o.jpg?_nc_cat=108&_nc_sid=ca434c&_nc_eui2=AeEhF9utT65ZIXkc8UHqXCQPmzvwOTJeMCebO_A5Ml4wJ_1KZGX_HF6YzO15Hvp052bns3j6_6dz20SDobV367At&_nc_ohc=tyb2ikZ9r7EAX-wrN94&_nc_ht=scontent-frt3-1.xx&_nc_tp=6&oh=15e166989bb9f05f93b8b9ea3bc161ba&oe=5ED39C37
 *
 * Copyright (C) 2020 Alexander Kraus <nr4@z10.info>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

#version 130

out vec4 gl_FragColor;

const vec2 iResolution = vec2(1920, 1080);
const float fsaa = 9.;

const float pi = acos(-1.);
const vec3 c = vec3(1.,0.,-1.);
const float box_size = .45,
    depth = 7.,
    dz = -.01;

// Creative Commons Attribution-ShareAlike 4.0 International Public License
// Created by David Hoskins.
// See https://www.shadertoy.com/view/4djSRW
void hash13(in vec3 p3, out float d)
{
	p3  = fract(p3 * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    d = fract((p3.x + p3.y) * p3.z);
}

void hash12(in vec2 p, out float d)
{
	vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    d = fract((p3.x + p3.y) * p3.z);
}
// End of CC-A-SA 4.0 Public License

void dbox3(in vec3 x, in vec3 b, out float d)
{
  vec3 da = abs(x) - b;
  d = length(max(da,0.0))
         + min(max(da.x,max(da.y,da.z)),0.0);
}

void dbox3_wireframe(in vec3 x, in vec3 b, in float db, out float d)
{
    dbox3(x,b,d);
    
    float da;
    dbox3(x, b+c.zzx*db, da);
    d = max(d, -da);
    dbox3(x, b+c.xzz*db, da);
    d = max(d, -da);
    dbox3(x, b+c.zxz*db, da);
    d = max(d, -da);
}

void zextrude(in float z, in float d2d, in float h, out float d)
{
    vec2 w = vec2(d2d, abs(z)-0.5*h);
    d = min(max(w.x,w.y),0.0) + length(max(w,0.0));
}

void add(in vec2 sda, in vec2 sdb, out vec2 sdf)
{
    sdf = (sda.x<sdb.x)?sda:sdb;
}

void sub(in vec2 sda, in vec2 sdb, out vec2 sdf)
{
    sdf = (sda.x>sdb.x)?abs(sda):abs(sdb)*c.zx;
}

float sm(in float d)
{
    return smoothstep(1.5/iResolution.y, -1.5/iResolution.y, d);
}

void main_scene(in vec3 x, out vec2 sdf)
{
    float d,
        size = box_size,
        r;

    sdf = vec2(x.z+box_size-dz,0.);
        
    for(float i=0.; i<depth; i+=1.)
    {
        vec3 y = mod(x, size*c.xxx)-.5*size,
            yi = (x-y)/size*2.;
        if(max(abs(yi.x),abs(yi.y))> pow(2.,i+1.)) 
            break;
        hash13(1.e2*yi-100.*i, r);
        if(r > .4)
        {
            dbox3_wireframe(y, (.5*r-.05*i)*size*c.xxx, (.2-.01*i)*(.5*r-.05*i)*size, d);
            r = 2.*(r-.5);
            if(r<.5)add(sdf, vec2(d,1.), sdf);
            else add(sdf, vec2(d,-1.), sdf);
        } else break;
        if(r > .6)
		{
            dbox3(y, (.45*r-.05*i)*size*c.xxx, d);
        	r = 2.5*(r-.6);
            add(sdf, vec2(d, 2.+floor(3.*r)), sdf);
        }
        size /= 2.;
    }
    vec3 yi = vec3(-1.,-1.,-1.);
    hash13(1.e2*yi, r);
    dbox3_wireframe(x-.5*yi*box_size, .525*r*box_size*c.xxx, .28*.5*r*box_size, d);
    add(sdf, vec2(d, 1.), sdf);
}

#define normal(o, t)void o(in vec3 x, out vec3 n, in float dx){vec2 s, na;t(x,s);t(x+dx*c.xyy, na);n.x = na.x;t(x+dx*c.yxy, na);n.y = na.x;t(x+dx*c.yyx, na);n.z = na.x;n = normalize(n-s.x);} 
normal(main_normal, main_scene)

#define march(id, sid, exit, step)void id(out vec3 x, in vec3 o, inout float d, in vec3 dir, in int N, out int i, out vec2 s){for(i = 0; i<N; ++i){x=o+d*dir;sid(x,s);if(s.x < 1.e-4) return; if(exit){i=N;}d+=step;}}
march(march_main, main_scene, max(max(abs(x.x),abs(x.y)),abs(x.z))>1.1*box_size, min(s.x,5.e-4))
march(march_shadow, main_scene, x.z>.5,min(s.x,1.e-2))

void analytical_box(in vec3 o, in vec3 dir, in vec3 size, out float d)
{
    vec3 tlo = min((size-o)/dir,(-size-o)/dir); // Select 3 visible planes
    vec2 abxlo = abs(o.yz + tlo.x*dir.yz),
        abylo = abs(o.xz + tlo.y*dir.xz),
        abzlo = abs(o.xy + tlo.z*dir.xy);
    vec4 dn = 100.*c.xyyy;
    
    dn = mix(dn, vec4(tlo.x,c.xyy), float(all(lessThan(abxlo,size.yz)))*step(tlo.x,dn.x));
    dn = mix(dn, vec4(tlo.y,c.yxy), float(all(lessThan(abylo,size.xz)))*step(tlo.y,dn.x));
    dn = mix(dn, vec4(tlo.z,c.yyx), float(all(lessThan(abzlo,size.xy)))*step(tlo.z,dn.x));

    d = dn.r;
}

void illuminate(in vec3 x, in vec3 n, in vec3 dir, in vec3 l, inout vec3 col, in vec2 s)
{
    if(s.y == -1.) // Structure wireframe black
    {
        col = vec3(0.09,0.09,0.09);
        col = .6*col
            + .8*col*max(dot(l-x,n),0.)
            + 1.5*col*pow(max(dot(reflect(l-x,n),dir),0.),2.);
    }
    else if(s.y == 0.) // Floor
    {
        col = .1*c.xxx;
        col = .1*col
            + .8*col*max(dot(l-x,n),0.)
            + .5*col*pow(max(dot(reflect(l-x,n),dir),0.),2.);
    }
    else if(s.y == 1.) // Structure wireframe white
    {
        col = .4*c.xxx;
        col = .6*col
            + .8*col*max(dot(l-x,n),0.)
            + 1.5*col*pow(max(dot(reflect(l-x,n),dir),0.),2.);
    }
    else if(s.y == 2.) // Red inside
    {
        col = vec3(1.00,0.29,0.24);
        col = .7*col
            + .8*col*max(dot(l-x,n),0.)
            + .5*col*pow(max(dot(reflect(l-x,n),dir),0.),2.);
    }
    else if(s.y == 3.) // Green inside
    {
        col = vec3(0.33,0.86,0.10);
        col = .7*col
            + .8*col*max(dot(l-x,n),0.)
            + .5*col*pow(max(dot(reflect(l-x,n),dir),0.),2.);
    }
    else if(s.y == 4.) // Yellow inside
    {
        col = vec3(1.00,0.59,0.12);
        col = .7*col
            + .8*col*max(dot(l-x,n),0.)
            + .5*col*pow(max(dot(reflect(l-x,n),dir),0.),2.);
    }
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y,
        s, ss,
        s0;
    vec3 col = c.yyy,
        o = 2.*c.zzx-.4*c.yyx+.05*c.zzy,
        o0 = o,
        r = c.xzy,
        t = c.yyy, 
        u = cross(normalize(t-o),-r),
        dir,
        n, 
        x,
        c1 = c.yyy,
        l,
        l2,
        dir0,
        x0,
        c2,
        n0;
    int N = 1500,
        i;
    float d = 0., d0;
    
    t += uv.x * r + uv.y * u;
    dir = normalize(t-o);
    
    analytical_box(o, dir, box_size*c.xxx, d);
    if(d > 1.e1) 
    {
        d = -(o.z+box_size-dz)/dir.z;
    	x = o + d * dir;
        main_scene(x,s);
    }
    march_main(x, o, d, dir, N, i, s);
    
    l = c.xzx;
    l2 = c.zxx;
    
    if(i<N)
    {
        main_normal(x, n, 5.e-5);
        n = round(n);
    }
    else
    {
    	d = -(o.z+box_size-dz)/dir.z;
    	x = o + d * dir;
        main_scene(x,s);
        main_normal(x, n, 5.e-5);
        n = round(n);
    }
    
    illuminate(x, n, dir, l, col, s);
    illuminate(x, n, dir, l2, c1, s);
    col = mix(col, c1, .5);
    
    if(s.y == 0.)
    {
        o0 = x;
        dir0 = reflect(dir, n);
        d0 = .01;
        analytical_box(o0, dir0, box_size*c.xxx, d0);
        march_main(x0, o0, d0, dir0, N, i, s0);
        
        if(i<N)
        {
            main_normal(x0, n0, 5.e-4);
            n = round(n);
            illuminate(x0, n0, dir0, l, c1, s0);
            illuminate(x0, n0, dir0, l2, c2, s0);
            c1 = mix(c1, c2, .5);
        	col = mix(col, c1, .1);
        }
    }
    
    
    // Hard shadow
    // {
    //     o = x;
    //     dir = normalize(l-x);
    //     d = 1.e-2;
        
    //     march_shadow(x, o, d, dir, N, i, s);
        
    //     if(x.z<.5)
    //     {
    //         //col = c.xyy;
    //         col *= .6;
    //     }
    // }

    // Soft shadow
    x0 = x;

    o = x;
    dir = normalize(l-x);
    d = 1.e-2;
    // analytical_box(o, dir, box_size*c.xxx, d);
    
    // if(d < 1.e2)
    {
        float res = 1.0;
        float ph = 1.e20;
        for(int i=0; i<N; ++i)
        // for(d=1.e-2; x.z<.5; )
        {
            x = o + d * dir;
            main_scene(x, s);
            if(s.x < 1.e-4) 
            {
                res = 0.;
                break;
            }
            if(x.z>.5) break;
            float y = s.x*s.x/(2.0*ph);
            float da = sqrt(s.x*s.x-y*y);
            res = min( res, 100.0*da/max(0.0,d-y) );
            ph = s.x;
            d += min(s.x,5.e-3);
        }
        col = mix(.3*col, col, res);
    }

    // o = x0;
    // dir = normalize(l2-x0);
    // d = 1.e-2;
    // {
    //     float res = 1.0;
    //     float ph = 1e20;
    //     for(int i=0; i<N; ++i)
    //     // for(d=1.e-2; x.z<.5; )
    //     {
    //         x = o + d * dir;
    //         main_scene(x, s);
    //         if(s.x < 1.e-4) 
    //         {
    //             res = 0.;
    //             break;
    //         }
    //         if(x.z>.5) break;
    //         float y = s.x*s.x/(2.0*ph);
    //         float da = sqrt(s.x*s.x-y*y);
    //         res = min( res, 100.0*da/max(0.0,d-y) );
    //         ph = s.x;
    //         d += min(s.x,5.e-3);
    //     }
    //     col = mix(.6*col, col, res);
    // }
    // Ambient
	//col *= (1.+1./length(x-l));
    
    // Gamma
    col = col + 1.*col*col*col;
    // col *= col;
    //col = col + 1.*col*col;
    
    fragColor = vec4(clamp(col,0.,1.),1.);
}

void main()
{
    vec4 col = vec4(0.);
    float bound = sqrt(fsaa)-1.;
   	for(float i = -.5*bound; i<=.5*bound; i+=1.)
        for(float j=-.5*bound; j<=.5*bound; j+=1.)
        {
            vec4 c1;
            mainImage(c1, gl_FragCoord.xy+vec2(i,j)*1./max(bound, 1.));
     		col += c1;
        }
    col /= fsaa;
    gl_FragColor = col;
}
