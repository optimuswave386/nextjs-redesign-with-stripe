import React from 'react';
//import { useEffect, useRef, useState } from "react";
import { getDb } from "@/lib/mongodb";

export async function DesignNotes({ xitemsonly }: { xitemsonly: number | string }) {

    const db = await getDb();
    const limitCount: number = typeof xitemsonly === 'number' 
        ? xitemsonly
        : parseInt(xitemsonly, 10) || 10;
    const designNotes = await db.collection('designnotes').find({}).sort({ order: 1, datenoted: -1 }).limit(limitCount).toArray();
    
    return (
        <>
            <h1>My Design Notes</h1>
            <section className="designnotes">
                {designNotes.map((note:any) => ( 
                    <React.Fragment key={note._id}>
                        <span>
                            <p><strong>{new Intl.DateTimeFormat('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric',
                                timeZone: 'UTC'
                            }).format(new Date(note.datenoted)).replace(/\//g, '.')}</strong><br />
                            {note.note}</p>
                            <ul className="note">
                            {   
                                note.links.hrefs.length >0 && note.links.hrefs.map((redirect:any) => (
                                        <li key={redirect[1]}><span className="category">{redirect[2]}</span>&#8594;<span className="linktext"><a className="weblink" href={redirect[0]}>{redirect[1]}</a></span></li>                                                
                                ))
                            }
                            </ul>
                        </span>
                    </React.Fragment>
                ))}
            </section>
            {/* 
                    
            */}
        </>
    );

}