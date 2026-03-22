// @ts-nocheck
/**
 * FILE LOCATION: src/components/AITestReport.jsx
 *
 * EXPORTS:
 *   generateAndSaveReport(testData, userId) — generates PDF, uploads to Supabase Storage,
 *                                             saves download URL to Firestore
 *   fetchReportUrl(userId, level, date)     — get existing report URL from Firestore
 *   default DownloadAIReportButton          — Results card button (fetches + downloads)
 *
 * FLOW:
 *   1. Try AI API → if fails, use manual template (15 score×level combinations)
 *   2. Build PDF with jsPDF
 *   3. Upload to Supabase Storage: faizupy-storage/reports/{userId}/{fileName}.pdf
 *   4. Save download URL to Firestore: users/{userId}/reports/{level}_{date}
 *   5. URL is permanent — always available after refresh
 */

import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import supabase from '../supabaseClient';

const AI_API_URL = 'https://white-limit-e2fe.luckyfaizu3.workers.dev/chat';
const AI_MODEL   = 'claude-sonnet-4-20250514';

// ════════════════════════════════════════════════════════════
// FIREBASE HELPERS
// ════════════════════════════════════════════════════════════

function reportDocId(level, date) {
  return `${(level || 'basic').toLowerCase()}_${(date || '').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
}

async function saveReportUrl(userId, level, date, downloadUrl, fileName) {
  try {
    const docId = reportDocId(level, date);
    await setDoc(
      doc(db, 'users', userId, 'reports', docId),
      { downloadUrl, fileName, level, date, createdAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (e) {
    console.warn('[Report] Firestore save failed:', e?.message);
  }
}

export async function fetchReportUrl(userId, level, date) {
  try {
    const docId = reportDocId(level, date);
    const snap  = await getDoc(doc(db, 'users', userId, 'reports', docId));
    if (snap.exists()) return snap.data();
    return null;
  } catch (e) {
    return null;
  }
}

// Upload PDF blob to Supabase Storage, return public URL
async function uploadToStorage(userId, level, date, pdfBlob, fileName) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path     = `reports/${userId}/${safeName}`;
  const { error } = await supabase.storage
    .from('faizupy-storage')
    .upload(path, pdfBlob, { contentType: 'application/pdf', upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage
    .from('faizupy-storage')
    .getPublicUrl(path);
  return data.publicUrl;
}

// ════════════════════════════════════════════════════════════
// MANUAL FALLBACK TEMPLATES
// ════════════════════════════════════════════════════════════
function getManualReport(testData) {
  const score  = testData.score || testData.percentage || 0;
  const level  = (testData.level || 'basic').toLowerCase();
  const name   = testData.studentInfo?.fullName || testData.studentInfo?.name || 'Student';
  const cor    = testData.correct || 0;
  const wrg    = testData.wrong   || 0;
  const tot    = testData.total   || 0;
  const dur    = testData.timeTaken || 'N/A';
  const tier   = score <= 39 ? 'low' : score <= 54 ? 'mid' : score <= 69 ? 'pass' : score <= 84 ? 'good' : 'excellent';

  const bank = {
    basic: {
      low: {
        overall: `${name} attempted the Python Basic Mock Test and scored ${score}% (${cor} correct out of ${tot} questions) in ${dur}. This result indicates that the core Python fundamentals need significant attention before the next attempt. The test covers entry-level topics that form the foundation of all Python programming — mastering these will open the door to advanced concepts. This attempt is a valuable diagnostic tool showing exactly which areas to focus on.`,
        strengths: [`Showed initiative by taking the Python Basic Mock Test — the first step to mastery`, `Attempted all ${tot} questions, demonstrating commitment to completing the challenge`, `The ${cor} correct answers indicate familiarity with at least some basic Python syntax`, `Taking this test provides a clear roadmap of topics that need practice`],
        improvement: [`Python variables and data types — int, float, str, bool — practice declaring and using each`, `Conditional statements — if, elif, else — write small programs to reinforce logic`, `Loops — for and while — practice iterating over lists, ranges, and strings`, `Functions — learn to define, call, and pass arguments; understand return values`, `Lists and dictionaries — practice creating, accessing, modifying, and iterating these structures`, `String operations — slicing, concatenation, and common string methods like .upper(), .split()`],
        study: [`Start with Python basics on W3Schools or freeCodeCamp — spend 45 minutes daily for 2 weeks`, `Code every day — write at least 3 small Python programs per day to build muscle memory`, `Use Python IDLE or VS Code to run code as you learn — do not just read theory`, `Make flashcards for data types, operators, and built-in functions — review them daily`, `After each topic, solve 10 MCQs on that topic before moving forward`, `Retake this mock test after 7 days of focused study — aim for 55% or above`],
        motivation: `${name}, every Python master started exactly where you are right now. A score of ${score}% is not a failure — it is your starting point. The ${cor} questions you got right show that you already have some knowledge. Focus on the improvement areas above, practice every single day, and come back for another attempt. The certificate is waiting for you — you just need to earn it step by step. Believe in the process!`,
      },
      mid: {
        overall: `${name} passed the Python Basic Mock Test with a score of ${score}% (${cor} correct out of ${tot} questions) in ${dur}. This is a solid result — the test has been cleared successfully! However, to earn the Python Basic Certificate, a score of 55% or above is required. At ${score}%, you are just ${55 - score}% away from the certificate. A focused revision of weak topics will easily bridge this gap in the next attempt.`,
        strengths: [`Successfully passed the Python Basic Mock Test — this is a real achievement`, `Scored ${cor} out of ${tot}, showing a working understanding of Python fundamentals`, `Comfortable with basic Python syntax including variables, operators, and simple programs`, `Demonstrated ability to work through ${tot} questions within the time limit`, `Understanding of 40-54% of Python Basic concepts — a strong foundation to build on`],
        improvement: [`Functions and scope — practice writing reusable functions with parameters and return values`, `List and dictionary operations — slicing, comprehensions, .append(), .get(), .keys()`, `String manipulation — formatting with f-strings, .strip(), .replace(), .find()`, `Error handling basics — understand try-except blocks for handling common errors`, `File I/O basics — reading and writing to text files using open(), read(), write()`, `Review the ${wrg} questions you got wrong and identify the common topic patterns`],
        study: [`Focus on the gap areas above for 1 hour daily — you only need ${55 - score}% more to get the certificate`, `Practice functions extensively — write 5 different functions every day for a week`, `Do practice exercises on HackerRank easy Python problems`, `Review your wrong answers from this test and write code to solve each problem type`, `Watch one 15-minute Python tutorial video per day on your weak topics`, `Retake this test in 5-7 days — you are very close to the certificate!`],
        motivation: `${name}, you passed the test — that deserves recognition! You are only ${55 - score}% away from earning your Python Basic Certificate. That is not a big gap at all. With focused revision of the topics above and consistent daily practice, your next attempt will easily cross 55%. The certificate is almost yours — do not give up now. Come back stronger!`,
      },
      pass: {
        overall: `${name} has passed the Python Basic Mock Test with a score of ${score}% (${cor} correct out of ${tot} questions) in ${dur}, successfully earning a Python Basic Certificate of Achievement. This is a commendable result that confirms a solid understanding of Python entry-level concepts. The certificate has been officially issued and can be downloaded, shared on LinkedIn, and verified at faizupyzone.shop. This achievement marks the beginning of a strong Python journey.`,
        strengths: [`Earned the Python Basic Certificate with a score of ${score}% — officially certified!`, `Strong understanding of Python variables, data types, operators, and control flow`, `Comfortable with functions — defining, calling, and using return values correctly`, `Good grasp of list and string operations, which are used in almost every Python program`, `Completed ${cor} out of ${tot} questions correctly — demonstrating consistent knowledge`],
        improvement: [`Dictionaries and sets — practice advanced operations like nested dicts and set methods`, `List comprehensions — a Pythonic way to create lists; master the syntax and use cases`, `Exception handling — understand try-except-finally and when to use each`, `Modules — learn to import and use os, sys, math, random, and datetime`, `Prepare for Python Advanced level — topics include OOP, decorators, and generators`, `Review the ${wrg} incorrect answers to identify any remaining knowledge gaps`],
        study: [`You have earned the Basic certificate — now aim for the Advanced level next`, `Study OOP concepts — classes, objects, inheritance, and polymorphism — 1 hour daily`, `Practice Python projects: build a calculator, to-do list, or number guessing game`, `Read "Automate the Boring Stuff with Python" (free online) — excellent next step`, `Solve intermediate Python problems on LeetCode or HackerRank to sharpen skills`, `Retake the Basic test to improve your score, or attempt the Advanced mock test`],
        motivation: `Congratulations, ${name}! You have officially earned your Python Basic Certificate — this is a real achievement that you should be proud of. Add it to your LinkedIn profile, your resume, and your portfolio. Every certified Python developer started with this exact certificate. Now set your sights on the Advanced level — keep the momentum going. Pyskill is proud of you!`,
      },
      good: {
        overall: `${name} has achieved an excellent score of ${score}% on the Python Basic Mock Test (${cor} correct out of ${tot} questions) in ${dur}, earning a Python Basic Certificate of Achievement with distinction. This result demonstrates strong command over Python fundamentals and places ${name} well above the average student. The certificate is officially issued and ready for download. This performance reflects genuine understanding — a remarkable achievement.`,
        strengths: [`Outstanding Python Basic performance — scored ${score}%, significantly above the pass mark`, `Deep understanding of variables, data types, operators, and control structures`, `Strong command of functions, lists, dictionaries, and string operations`, `Answered ${cor} out of ${tot} questions correctly — consistent and reliable performance`, `Demonstrated the ability to think logically and apply Python concepts under timed conditions`],
        improvement: [`Advanced string formatting — f-strings, .format(), and string templates`, `Deeper OOP knowledge — start learning classes, objects, and inheritance for Advanced level`, `File handling — reading, writing, and appending to files with context managers`, `Error handling — master try-except-finally and custom exceptions`, `List comprehensions and dictionary comprehensions — write more Pythonic code`],
        study: [`You are ready for the Python Advanced level — register and take the Advanced mock test`, `Begin studying OOP in Python — classes, objects, inheritance — 1.5 hours daily`, `Build real Python projects: weather app, student grade tracker, or simple web scraper`, `Contribute to small open-source Python projects on GitHub to gain practical experience`, `Read Python documentation on topics you want to deepen — docs.python.org is excellent`],
        motivation: `Fantastic work, ${name}! A score of ${score}% is truly impressive and reflects the dedication you have put into learning Python. Your certificate is officially earned and waiting to be shared with the world. You clearly have the aptitude for programming — do not stop here. The Advanced level is your next challenge. Take it on with the same energy and you will succeed just as brilliantly!`,
      },
      excellent: {
        overall: `${name} has delivered an outstanding performance on the Python Basic Mock Test, scoring ${score}% (${cor} correct out of ${tot} questions) in ${dur}. This near-perfect or perfect score places ${name} in the top tier of all Python Basic test takers on Pyskill. A Certificate of Achievement with the highest distinction has been earned. This exceptional result demonstrates mastery of Python fundamentals and complete readiness to tackle Advanced-level Python topics immediately.`,
        strengths: [`Exceptional Python mastery — scored ${score}% on the Basic level with near-perfect accuracy`, `Complete command of all fundamental Python concepts tested at this level`, `Excellent speed and accuracy — answered ${cor} out of ${tot} within the given time`, `Strong logical reasoning and problem-solving skills demonstrated throughout the test`, `Ready for Python Advanced level — all Basic fundamentals are clearly mastered`],
        improvement: [`Begin Advanced Python topics immediately — you have outgrown the Basic level`, `Deep dive into OOP — classes, inheritance, polymorphism, encapsulation, and abstraction`, `Study Python decorators, generators, and context managers`, `Learn about Python's built-in modules — itertools, functools, collections`, `Practice writing clean, Pythonic code following PEP 8 style guidelines`],
        study: [`Register for the Python Advanced Mock Test — you are clearly ready for it`, `Study advanced Python in "Fluent Python" by Luciano Ramalho — highly recommended`, `Build a full Python project: REST API, web scraper, or data analysis project`, `Participate in Python coding challenges on LeetCode, Codeforces, or HackerRank`, `Start learning a Python framework — Flask or Django — to expand your career options`],
        motivation: `Absolutely phenomenal, ${name}! A score of ${score}% is exceptional — you have completely mastered Python at the Basic level. Your certificate is not just earned, it is earned with the highest distinction. Share it with pride on LinkedIn and your portfolio. Now take the next step: the Advanced mock test is waiting for someone of your caliber. We have no doubt you will excel there too. Keep being extraordinary!`,
      },
    },
    advanced: {
      low: {
        overall: `${name} attempted the Python Advanced Mock Test and scored ${score}% (${cor} correct out of ${tot} questions) in ${dur}. The Advanced level tests intermediate Python skills including OOP, decorators, generators, file handling, and modules — these are genuinely challenging topics. This result is a clear indication of where focused study is needed. The ${cor} questions answered correctly show some existing knowledge that can be built upon with structured practice.`,
        strengths: [`Demonstrated courage by attempting the Python Advanced level — not an easy test`, `Answered ${cor} out of ${tot} questions correctly, showing partial knowledge of advanced topics`, `Familiarity with at least some OOP concepts and Python intermediate syntax`, `Attempting the Advanced test provides a precise map of knowledge gaps to address`],
        improvement: [`Object-Oriented Programming — classes, objects, __init__, inheritance, method overriding`, `Decorators — understand how @decorator syntax works and create custom decorators`, `Generators — study yield keyword, generator expressions, and lazy evaluation`, `Context managers — understand with statement and write custom __enter__/__exit__`, `Exception handling — custom exceptions, exception hierarchy, and re-raising`, `Modules and packages — importing, __name__, __init__.py, and package structure`],
        study: [`Go back and strengthen Python Basic concepts first if any gaps remain`, `Study OOP systematically — dedicate one full week just to classes and inheritance`, `Watch Python intermediate tutorials on Real Python (realpython.com) — excellent resource`, `Code daily — write one class-based program every day for two weeks`, `Solve HackerRank Python intermediate challenges — OOP and Functional Programming sections`, `Retake the Advanced mock test after 2-3 weeks of focused preparation`],
        motivation: `${name}, the Advanced level is genuinely difficult — do not be discouraged by this score. The topics it covers take time to master. The ${cor} correct answers you got prove you have a starting point. Study the areas above systematically, practice coding every day, and your understanding will grow rapidly. Come back in a few weeks and you will be amazed at how much you have improved. Progress, not perfection, is the goal!`,
      },
      mid: {
        overall: `${name} has passed the Python Advanced Mock Test with a score of ${score}% (${cor} correct out of ${tot} questions) in ${dur}. This is a meaningful achievement — the Advanced level tests challenging intermediate Python skills. However, the Python Advanced Certificate requires a score of 55% or above. At ${score}%, you are only ${55 - score}% short of the certificate. A targeted review of the topics where marks were dropped will comfortably push the score past 55% in the next attempt.`,
        strengths: [`Passed the Python Advanced Mock Test — cleared a genuinely difficult exam`, `Demonstrated understanding of OOP, at least basic decorators, and Python modules`, `Answered ${cor} out of ${tot} questions correctly — strong foundation of intermediate knowledge`, `Comfortable with most Python Basic and some Advanced concepts`, `Showed ability to handle intermediate-level Python problems under time pressure`],
        improvement: [`Generators and iterators — study yield, next(), iter(), and generator expressions in depth`, `Advanced decorators — functools.wraps, class decorators, and decorator factories`, `Context managers — using contextlib and writing custom __enter__/__exit__ methods`, `List, dict, and set comprehensions — master all three and understand their performance benefits`, `Lambda functions and functional programming — map(), filter(), reduce() with lambda`, `Python's dunder methods — __str__, __repr__, __len__, __eq__ and when to use each`],
        study: [`You need only ${55 - score}% more — focus exclusively on your weak topics for 5-7 days`, `Practice generators and decorators daily — write at least 2 examples of each per day`, `Read "Python Tricks" by Dan Bader — focuses exactly on intermediate Python skills`, `Review your ${wrg} wrong answers and write code that solves each problem type`, `Use Real Python tutorials (realpython.com) for advanced topic deep-dives`, `Retake the Advanced test in 7 days — the certificate is almost in your hands`],
        motivation: `${name}, you passed the Advanced test — that is already an accomplishment most students struggle with! You are just ${55 - score}% away from a certificate that will genuinely impress employers and colleges. A few more days of focused study on the improvement areas above will easily bridge that gap. You have already proven you can handle this level. Come back for one more attempt and make it count!`,
      },
      pass: {
        overall: `${name} has passed the Python Advanced Mock Test with a score of ${score}% (${cor} correct out of ${tot} questions) in ${dur}, earning a Python Advanced Certificate of Achievement. This is a significant accomplishment that demonstrates solid intermediate Python skills including OOP, decorators, generators, and modules. The certificate is officially issued, ready for download, and verifiable at faizupyzone.shop.`,
        strengths: [`Earned the Python Advanced Certificate — a qualification that stands out on resumes`, `Strong understanding of OOP — classes, inheritance, encapsulation, and polymorphism`, `Working knowledge of decorators, generators, and Python's functional programming features`, `Solid command of exception handling, file I/O, and Python module system`, `Answered ${cor} out of ${tot} questions correctly — consistent intermediate-level performance`],
        improvement: [`Python metaclasses — understand how class creation works at a deeper level`, `Async programming basics — asyncio, async/await syntax, and event loops`, `Python's data model — dunder methods in depth and how Python uses them internally`, `Performance optimization — profiling code with cProfile and optimizing bottlenecks`, `Design patterns in Python — Singleton, Factory, Observer, and Strategy patterns`],
        study: [`You have earned the Advanced certificate — now target the Python Pro level`, `Study asyncio and async/await for 1 hour daily — it is essential for modern Python`, `Work through "Python Cookbook" by David Beazley for advanced recipes`, `Build a real project: REST API with Flask, data analysis with pandas, or a CLI tool`, `Take the Python Pro Mock Test when ready — your Advanced cert shows you can do it`],
        motivation: `Congratulations, ${name}! You have earned your Python Advanced Certificate — this is a real credential that demonstrates intermediate Python mastery. Add it to your LinkedIn, your GitHub profile, and your resume right now. Advanced Python developers are genuinely sought after in the job market. Your next target is the Pro level — and with the skills you have already demonstrated, you are more than capable of achieving it. Keep going!`,
      },
      good: {
        overall: `${name} has demonstrated strong intermediate Python proficiency with a score of ${score}% on the Python Advanced Mock Test (${cor} correct out of ${tot} questions) in ${dur}. This result significantly exceeds the certificate threshold and earns a Python Advanced Certificate with distinction. The performance across OOP, decorators, generators, and modules indicates thorough preparation and deep understanding of Python at the intermediate level.`,
        strengths: [`Scored ${score}% on the Advanced level — well above the certificate threshold`, `Deep understanding of OOP, decorators, generators, context managers, and modules`, `Excellent command of Python's functional programming features and data structures`, `Strong file handling and exception management skills demonstrated`, `Consistent accuracy — answered ${cor} out of ${tot} questions correctly`],
        improvement: [`Async programming — asyncio, coroutines, event loops, and async context managers`, `Python metaclasses and descriptors — deep Python object model concepts`, `Performance profiling — using cProfile, memory_profiler, and optimization techniques`, `Design patterns — master Singleton, Factory, Strategy, and Observer in Python`, `Testing — pytest, unittest, test-driven development, and mocking`],
        study: [`You are ready for the Python Pro level — register and attempt it`, `Study Python internals — CPython, GIL, memory management, and garbage collection`, `Read "Fluent Python" by Luciano Ramalho — the definitive advanced Python book`, `Build a production-quality project: deploy a Flask/Django app or a data pipeline`, `Explore Python type hints and mypy for writing professional, type-safe code`],
        motivation: `Impressive work, ${name}! A score of ${score}% on the Advanced level is genuinely remarkable and demonstrates a level of Python knowledge that most developers take years to reach. Your Advanced certificate is earned with distinction — wear it with pride. The Pro level is your natural next challenge, and based on this performance, we are confident you have what it takes. Take that next step — the Python Pro Certificate awaits!`,
      },
      excellent: {
        overall: `${name} has achieved an outstanding score of ${score}% on the Python Advanced Mock Test (${cor} correct out of ${tot} questions) in ${dur} — a near-perfect or perfect performance. The Python Advanced Certificate of Achievement is awarded with the highest distinction. This performance demonstrates complete mastery of intermediate Python including advanced OOP, decorators, generators, context managers, and all module-related topics.`,
        strengths: [`Near-perfect Advanced Python performance — ${score}% is exceptional at this level`, `Complete mastery of OOP, decorators, generators, context managers, and Python modules`, `Excellent command of Python's data model, functional programming, and comprehensions`, `Outstanding speed and accuracy — ${cor} out of ${tot} correct is near-flawless`, `Fully ready for Pro-level Python — no significant gaps at the Advanced level`],
        improvement: [`Python Pro topics — metaclasses, async/await, concurrency with threading and multiprocessing`, `CPython internals — understand how Python executes code at a lower level`, `Advanced testing — pytest fixtures, parametrize, mock, and property-based testing`, `Packaging and distribution — PyPI, setup.py, pyproject.toml, and virtual environments`, `Python performance engineering — Cython, Numba, and C extensions`],
        study: [`Register for the Python Pro Mock Test immediately — you are ready for it`, `Study Cython and how to extend Python with C for performance-critical applications`, `Explore CPython source code on GitHub — understanding internals separates great from excellent`, `Contribute to significant Python open-source projects — Flask, Requests, or Celery`, `Pursue real Python certifications: PCEP, PCAP, or PCPP from Python Institute`],
        motivation: `Absolutely extraordinary, ${name}! Scoring ${score}% on the Python Advanced test is a phenomenal achievement. You have demonstrated a level of Python expertise that places you ahead of the vast majority of developers. Your Advanced certificate is awarded with the highest distinction. The Pro level is clearly your next step, and based on this performance, we have every confidence you will conquer it too. You are a Python master in the making!`,
      },
    },
    pro: {
      low: {
        overall: `${name} attempted the Python Pro Mock Test and scored ${score}% (${cor} correct out of ${tot} questions) in ${dur}. The Pro level is the most challenging test on Pyskill, covering metaclasses, async/await, concurrency, performance optimization, design patterns, testing, and packaging. This result highlights specific knowledge gaps at the professional level. The ${cor} correct answers indicate existing expertise that can be built upon with targeted advanced study.`,
        strengths: [`Demonstrated ambition by taking on the Python Pro level — the hardest test on Pyskill`, `Answered ${cor} out of ${tot} questions correctly, showing partial expert-level knowledge`, `Existing familiarity with some professional Python concepts and patterns`, `This result precisely identifies which pro-level topics need deepening`],
        improvement: [`Async programming — asyncio event loop, coroutines, tasks, and async context managers`, `Metaclasses — type(), __new__, __init_subclass__, and custom class creation`, `Concurrency — threading, multiprocessing, and concurrent.futures — when to use each`, `Design patterns — Factory, Singleton, Strategy, Observer, Decorator pattern in Python`, `Performance optimization — profiling with cProfile, using slots, and avoiding common bottlenecks`, `Testing mastery — pytest advanced features, fixtures, mocking, and test-driven development`],
        study: [`Ensure Python Advanced certificate is earned first — Pro builds directly on it`, `Study async Python in depth: "Python Concurrency with asyncio" by Matthew Fowler`, `Spend 2 weeks dedicated to design patterns in Python — one pattern per day`, `Practice pro-level Python on Exercism.io (Python track) and LeetCode medium/hard`, `Read CPython source code to understand Python internals at the implementation level`, `Retake the Pro test after 3-4 weeks of dedicated advanced study`],
        motivation: `${name}, attempting the Python Pro level takes real courage — this is the hardest Python test on the platform. Professional-level Python is challenging even for experienced developers. Your ${cor} correct answers show you already have significant knowledge. Study the pro topics above systematically and consistently, and your score will improve dramatically. Every expert Python developer had to climb this exact same mountain. Stay consistent and keep going — you are closer than you think!`,
      },
      mid: {
        overall: `${name} has passed the Python Pro Mock Test with a score of ${score}% (${cor} correct out of ${tot} questions) in ${dur}. Passing the Pro level test is a significant achievement — this is the most challenging Python assessment on Pyskill. The Python Pro Certificate requires 55% or above, and at ${score}%, you are just ${55 - score}% away. A targeted deep-dive into the specific topics where marks were dropped will comfortably bridge this small gap.`,
        strengths: [`Passed the Python Pro Mock Test — an achievement that very few students reach`, `Demonstrated professional-level Python knowledge in multiple areas`, `Understanding of async programming, design patterns, and advanced Python features`, `Answered ${cor} out of ${tot} questions correctly — strong expert-level foundation`, `Comfortable with performance considerations and Python's internal mechanisms`],
        improvement: [`Metaclasses and descriptors — __get__, __set__, __delete__ and the descriptor protocol`, `Advanced asyncio — event loop internals, asyncio.gather(), asyncio.Queue, and cancellation`, `Concurrency patterns — producer-consumer, thread pools, and process pools with futures`, `Advanced testing — property-based testing with Hypothesis, mutation testing`, `Packaging best practices — modern pyproject.toml, dependency management, and CI/CD`],
        study: [`Focus on the ${55 - score}% gap by reviewing your ${wrg} wrong answers in detail`, `Study "Fluent Python" by Luciano Ramalho — chapters on metaclasses and descriptors`, `Write async Python programs daily — build a real async project like a web scraper or API`, `Practice design pattern implementations in Python — code each pattern from scratch`, `Retake the Pro test in 7-10 days — the certificate is within reach`],
        motivation: `${name}, passing the Pro level test — even without the certificate this attempt — is something very few Python students achieve. You are only ${55 - score}% away from a Python Pro Certificate that truly distinguishes you as an expert. Review your weak areas, deepen your understanding of the specific topics above, and your next attempt will cross that 55% threshold. You are almost there!`,
      },
      pass: {
        overall: `${name} has passed the Python Pro Mock Test with a score of ${score}% (${cor} correct out of ${tot} questions) in ${dur}, earning a Python Pro Certificate of Achievement. Earning a Pro-level Python certification is a genuine professional milestone that very few developers achieve. This certificate demonstrates expert-level Python proficiency covering async programming, metaclasses, concurrency, design patterns, testing, and packaging. It is officially issued and verifiable at faizupyzone.shop.`,
        strengths: [`Earned the Python Pro Certificate — a credential that marks you as an expert`, `Strong command of async programming with asyncio and concurrent programming`, `Understanding of metaclasses, descriptors, and Python's advanced object model`, `Solid knowledge of design patterns and their Pythonic implementations`, `Expert-level testing skills — pytest, fixtures, mocking, and TDD principles`],
        improvement: [`CPython internals — bytecode, the GIL, memory allocator, and reference counting`, `Python performance engineering — Cython, Numba, C extensions for bottlenecks`, `Distributed systems in Python — Celery, Redis, RabbitMQ for async task queues`, `Advanced type system — TypeVar, Protocol, Literal, and runtime type checking`, `Python security best practices — avoiding common vulnerabilities in production code`],
        study: [`You have achieved Pro certification — now target real-world Python applications`, `Contribute to major Python open-source projects — Django, Flask, FastAPI, or Celery`, `Study CPython internals through the CPython Developer's Guide (devguide.python.org)`, `Build a production-ready Python service: microservice, ML pipeline, or DevOps tool`, `Mentor other Python learners — teaching deepens your own understanding enormously`],
        motivation: `Congratulations, ${name}! Earning a Python Pro Certificate is a remarkable achievement that very few developers can claim. You are now in an elite group of certified professional Python developers. This certificate belongs on your LinkedIn, resume, and portfolio immediately. The Python knowledge you have demonstrated opens doors to senior developer roles, data engineering, backend architecture, and more. Be proud of this achievement — you have truly earned it!`,
      },
      good: {
        overall: `${name} has demonstrated expert Python proficiency with a score of ${score}% on the Python Pro Mock Test (${cor} correct out of ${tot} questions) in ${dur} — earning the Python Pro Certificate of Achievement with distinction. This performance across the most challenging Python topics including async programming, metaclasses, concurrency, design patterns, and advanced testing marks ${name} as a genuinely expert Python developer.`,
        strengths: [`Scored ${score}% on the Pro level — well above the certificate threshold with distinction`, `Expert-level async programming — asyncio, coroutines, event loops, and async patterns`, `Deep understanding of metaclasses, descriptors, and Python's advanced object model`, `Mastery of concurrency — threading, multiprocessing, and concurrent.futures`, `Strong design pattern knowledge and advanced testing skills demonstrated`],
        improvement: [`CPython internals and bytecode — understand how your code actually executes`, `Python for high-performance computing — Cython, NumPy internals, and SIMD operations`, `Distributed Python — Apache Kafka integration, distributed task queues, microservices`, `Advanced security — secure coding patterns, preventing injection and timing attacks`, `Contributing to CPython itself — understanding the development and release process`],
        study: [`Consider contributing to CPython — your knowledge level is approaching that standard`, `Specialize in a Python domain: data science, web development, systems programming, or DevOps`, `Build open-source Python tools that solve real problems and publish them on PyPI`, `Study distributed systems and cloud architecture — Python expertise at scale`, `Consider Python mentorship or creating Python educational content to give back`],
        motivation: `Exceptional performance, ${name}! A score of ${score}% on the Python Pro level is a truly elite achievement. You are in the top tier of Python developers, not just on Pyskill but in the broader developer community. Your Pro certificate with distinction is a badge of genuine expertise. Use this achievement as a platform — whether that is senior roles, technical leadership, open-source contributions, or teaching others. The Python world is yours to shape. We are genuinely impressed!`,
      },
      excellent: {
        overall: `${name} has achieved a near-perfect or perfect score of ${score}% on the Python Pro Mock Test (${cor} correct out of ${tot} questions) in ${dur} — an extraordinary performance earning the Python Pro Certificate of Achievement with the highest possible distinction. This result demonstrates complete mastery of professional Python including async programming, metaclasses, concurrency, advanced design patterns, expert testing, and packaging. ${name} is among the highest-performing Python Pro students on the entire Pyskill platform.`,
        strengths: [`Near-perfect Pro level performance — ${score}% is extraordinary even for expert developers`, `Complete mastery of all professional Python topics tested at this level`, `Expert command of asyncio, metaclasses, descriptors, and Python's complete object model`, `Outstanding concurrency knowledge — threading, multiprocessing, and async patterns`, `Elite-level design pattern and testing knowledge demonstrated with ${cor}/${tot} accuracy`],
        improvement: [`CPython contribution — your knowledge is at the level where contributing to Python itself is realistic`, `Advanced distributed systems — designing fault-tolerant, scalable Python architectures`, `Python compiler tooling — AST manipulation, code generation, and DSL creation`, `Formal methods and program verification for Python applications`, `Teaching and mentoring — sharing your knowledge is the next level of mastery`],
        study: [`You have mastered Python Pro — consider contributing to CPython on GitHub`, `Write a Python library or framework that solves a real problem — publish it on PyPI`, `Explore Python compiler technologies — Cython, Nuitka, PyPy, and GraalPy`, `Speak at Python conferences (PyCon, EuroPython) and share your expertise`, `Mentor the next generation of Python developers — you have the knowledge to lead`],
        motivation: `Extraordinary achievement, ${name}! Scoring ${score}% on the Python Pro test is simply outstanding — you are among the elite of Python developers worldwide. Your Pro certificate with the highest distinction represents genuine mastery that took real dedication and intelligence to achieve. This is not just a certificate — it is proof that you are a world-class Python developer. The Python community needs people like you. Contribute, teach, build, and lead. You have more than earned the right to call yourself a Python expert!`,
      },
    },
  };

  const lvl     = ['basic', 'advanced', 'pro'].includes(level) ? level : 'basic';
  const content = bank[lvl][tier];

  return [
    'OVERALL PERFORMANCE', content.overall, '',
    'STRENGTHS IDENTIFIED', content.strengths.map(s => `- ${s}`).join('\n'), '',
    'AREAS NEEDING IMPROVEMENT', content.improvement.map(s => `- ${s}`).join('\n'), '',
    'STUDY RECOMMENDATIONS', content.study.map(s => `- ${s}`).join('\n'), '',
    'MOTIVATIONAL MESSAGE', content.motivation,
  ].join('\n');
}

// ════════════════════════════════════════════════════════════
// AI SUMMARY
// ════════════════════════════════════════════════════════════
async function fetchAISummary(testData) {
  const score      = testData.score || testData.percentage || 0;
  const level      = (testData.level || 'basic').toUpperCase();
  const name       = testData.studentInfo?.fullName || testData.studentInfo?.name || 'Student';
  const cor        = testData.correct || 0;
  const wrg        = testData.wrong   || 0;
  const tot        = testData.total   || 0;
  const dur        = testData.timeTaken || 'N/A';
  const hasCert    = score >= 55;
  const passedTest = score >= 40;
  const levelTopics = {
    BASIC:    'variables, data types, operators, if-else, loops, functions, lists, dictionaries, strings, basic OOP',
    ADVANCED: 'decorators, generators, context managers, advanced OOP, modules, file handling, exceptions, comprehensions',
    PRO:      'metaclasses, async/await, concurrency, performance optimization, design patterns, testing, packaging',
  };
  const scoreContext = hasCert
    ? `PASSED with Certificate (${score}% — certificate earned)`
    : passedTest
    ? `PASSED test (${score}% — needs 55% for certificate, ${55 - score}% more needed)`
    : `NOT PASSED (${score}% — needs 40% to pass, 55% for certificate)`;

  const res = await fetch(AI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL, max_tokens: 1100, stream: false,
      messages: [{ role: 'user', content: `You are a senior Python coach at Pyskill. Write a professional performance report.

Student: ${name} | Level: Python ${level} | Score: ${score}% | Correct: ${cor} | Wrong: ${wrg} | Total: ${tot} | Time: ${dur}
Result: ${scoreContext} | Certificate: ${hasCert ? 'YES' : 'NO'} | Topics: ${levelTopics[level] || levelTopics.BASIC}

Write with EXACTLY these 5 headings (plain text, no ** or ##):

OVERALL PERFORMANCE
2-3 sentences. Mention score, result, and certificate status.

STRENGTHS IDENTIFIED
3-4 bullet points starting with -

AREAS NEEDING IMPROVEMENT
3-5 bullet points starting with -

STUDY RECOMMENDATIONS
4-5 bullet points starting with -

MOTIVATIONAL MESSAGE
2-3 sentences. ${hasCert ? 'Celebrate and encourage next level.' : passedTest ? `${55 - score}% more for certificate.` : 'Strong motivation to retry.'}

Rules: Plain text only. No markdown. No question numbers. 280-340 words.` }],
    }),
    signal: AbortSignal.timeout(28000),
  });

  if (!res.ok) throw new Error(`API ${res.status}`);
  const rawText = await res.text();
  let text = '';
  try {
    const data = JSON.parse(rawText);
    text = data.content?.[0]?.text || data.choices?.[0]?.message?.content || '';
  } catch (_) {
    const parts = [];
    for (const line of rawText.split('\n')) {
      const t = line.trim();
      if (!t.startsWith('data:')) continue;
      const j = t.slice(5).trim();
      if (j === '[DONE]' || !j) continue;
      try { const c = JSON.parse(j); const d = c.delta?.text || c.choices?.[0]?.delta?.content || c.content?.[0]?.text || ''; if (d) parts.push(d); } catch (_) {}
    }
    text = parts.join('');
  }
  if (!text || text.length < 80) throw new Error('Empty AI response');
  return text.trim();
}

// ════════════════════════════════════════════════════════════
// PARSE SECTIONS
// ════════════════════════════════════════════════════════════
function parseSections(text) {
  const titles = ['OVERALL PERFORMANCE', 'STRENGTHS IDENTIFIED', 'AREAS NEEDING IMPROVEMENT', 'STUDY RECOMMENDATIONS', 'MOTIVATIONAL MESSAGE'];
  const upper = text.toUpperCase();
  return titles.map((title, i) => {
    const start = upper.indexOf(title);
    if (start === -1) return { title, body: '' };
    const bodyStart = start + title.length;
    const nextIdx   = i < titles.length - 1 ? upper.indexOf(titles[i + 1], bodyStart) : -1;
    return { title, body: text.slice(bodyStart, nextIdx === -1 ? undefined : nextIdx).trim() };
  });
}

// ════════════════════════════════════════════════════════════
// PYSKILL LOGO
// ════════════════════════════════════════════════════════════
async function drawPyskillLogo(doc, x, y, w, h) {
  try {
    const svgStr = `<svg width="512" height="512" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0A1628"/><stop offset="100%" stop-color="#0D2550"/></linearGradient><linearGradient id="gc2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00D4FF"/><stop offset="100%" stop-color="#0066FF"/></linearGradient><linearGradient id="ga2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00FFCC"/><stop offset="100%" stop-color="#00AAFF"/></linearGradient><linearGradient id="gt2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#00D4FF"/><stop offset="100%" stop-color="#0055FF"/></linearGradient></defs><circle cx="250" cy="250" r="240" fill="url(#bg2)"/><circle cx="250" cy="250" r="238" fill="none" stroke="#00D4FF" stroke-width="2" opacity="0.4"/><path d="M175,145 C155,145 148,155 148,168 L148,188 C148,200 138,208 125,210 C138,212 148,220 148,232 L148,252 C148,265 155,275 175,275" fill="none" stroke="url(#gc2)" stroke-width="12" stroke-linecap="round"/><path d="M325,145 C345,145 352,155 352,168 L352,188 C352,200 362,208 375,210 C362,212 352,220 352,232 L352,252 C352,265 345,275 325,275" fill="none" stroke="url(#gc2)" stroke-width="12" stroke-linecap="round"/><text x="250" y="222" font-family="Courier New,monospace" font-weight="900" font-size="72" fill="url(#ga2)" text-anchor="middle" dominant-baseline="central">Py</text><circle cx="250" cy="268" r="5" fill="#00FFCC" opacity="0.8"/><line x1="110" y1="305" x2="390" y2="305" stroke="#00D4FF" stroke-width="1" opacity="0.25"/><text x="250" y="348" font-family="Arial,sans-serif" font-weight="800" font-size="54" fill="url(#gt2)" text-anchor="middle" dominant-baseline="central" letter-spacing="6">PYSKILL</text><text x="250" y="390" font-family="Arial,sans-serif" font-weight="400" font-size="16" fill="#00AAFF" text-anchor="middle" dominant-baseline="central" letter-spacing="3" opacity="0.7">LEARN . CODE . GROW</text></svg>`;
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    canvas.getContext('2d').drawImage(img, 0, 0, 256, 256);
    URL.revokeObjectURL(url);
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, w, h);
  } catch (_) {
    doc.setFillColor(10, 22, 40); doc.circle(x + w / 2, y + h / 2, w / 2, 'F');
  }
}

// ════════════════════════════════════════════════════════════
// jsPDF LOADER
// ════════════════════════════════════════════════════════════
function loadJsPDF() {
  return new Promise((resolve, reject) => {
    if (window.jspdf?.jsPDF) { resolve(window.jspdf.jsPDF); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload  = () => window.jspdf?.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error('jsPDF not found'));
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ════════════════════════════════════════════════════════════
// PDF BUILDER
// ════════════════════════════════════════════════════════════
async function buildPDF(testData, reportText) {
  const JsPDF = await loadJsPDF();
  const doc   = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 15, CW = W - M * 2;
  const score      = testData.score || testData.percentage || 0;
  const name       = testData.studentInfo?.fullName || testData.studentInfo?.name || 'Student';
  const email      = testData.studentInfo?.email    || testData.userEmail || '';
  const age        = testData.studentInfo?.age      || '';
  const addr       = testData.studentInfo?.address  || '';
  const level      = (testData.level || 'basic').toUpperCase();
  const date       = testData.testDate || new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const time       = testData.testTime || '';
  const cor        = testData.correct   || 0;
  const wrg        = testData.wrong     || 0;
  const tot        = testData.total     || 0;
  const dur        = testData.timeTaken || 'N/A';
  const hasCert    = score >= 55;
  const passedTest = score >= 40;
  const C = {
    indigo:[99,102,241], violet:[139,92,246], indigoDk:[67,56,202], indigoL:[199,210,254],
    green:[16,185,129],  red:[239,68,68],     amber:[245,158,11],   slate:[15,23,42],
    slateM:[51,65,85],   gray:[100,116,139],  grayL:[148,163,184],  light:[248,250,252],
    white:[255,255,255], border:[226,232,240],
  };
  const rClr = hasCert ? C.green : passedTest ? C.amber : C.red;

  const drawWatermark = () => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(44); doc.setTextColor(220, 222, 250);
    [[10,55],[80,30],[148,55],[10,125],[80,100],[148,125],[10,195],[80,170],[148,195],[10,265],[80,240],[148,265]]
      .forEach(([x,y]) => doc.text('PYSKILL', x, y, { angle: 33 }));
    doc.setTextColor(...C.slate);
  };

  drawWatermark();

  // Header
  doc.setFillColor(...C.indigoDk); doc.rect(0,0,W,58,'F');
  doc.setFillColor(...C.indigo);   doc.rect(0,40,W,18,'F');
  doc.setFillColor(...C.violet);   doc.rect(0,55,W,3,'F');
  await drawPyskillLogo(doc, W-M-17, 5, 17, 17);
  doc.setTextColor(...C.white); doc.setFontSize(24); doc.setFont('helvetica','bold');
  doc.text('PYSKILL', M, 22);
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.setTextColor(...C.indigoL);
  doc.text('LEARN  •  CODE  •  GROW  |  faizupyzone.shop', M, 30);
  doc.setFillColor(...C.white); doc.setDrawColor(...C.indigoL);
  doc.roundedRect(W-M-52,34,52,18,3,3,'F');
  doc.setTextColor(...C.indigoDk); doc.setFontSize(7); doc.setFont('helvetica','bold');
  doc.text('PERFORMANCE', W-M-48, 42); doc.text('REPORT', W-M-36, 49);
  const lvlClr = ({BASIC:C.green, ADVANCED:C.indigo, PRO:C.amber})[level] || C.indigo;
  doc.setFillColor(...lvlClr); doc.roundedRect(M,34,28,14,2,2,'F');
  doc.setTextColor(...C.white); doc.setFontSize(7.5); doc.setFont('helvetica','bold');
  doc.text(level, M+14-doc.getTextWidth(level)/2, 43);

  // Student card
  let y = 66;
  doc.setFillColor(...C.white); doc.setDrawColor(...C.border); doc.setLineWidth(0.5);
  doc.roundedRect(M,y,CW,44,4,4,'FD');
  doc.setFillColor(...C.indigo); doc.roundedRect(M,y,3,44,2,2,'F');
  doc.setTextColor(...C.slate); doc.setFontSize(15); doc.setFont('helvetica','bold');
  doc.text(name, M+8, y+11);
  const details = [['Email',email||'—'],['Level',`Python ${level} Mock Test`],['Date',date],['Time',time||'—'],['Duration',dur], ...(age?[['Age',age]]:[]), ...(addr?[['Location',addr]]:[])];
  const colW = CW/2-8;
  details.forEach(([lbl,val],i) => {
    const col=i%2, row=Math.floor(i/2), dx=M+8+col*(colW+16), dy=y+19+row*8;
    doc.setFontSize(6.5); doc.setFont('helvetica','normal'); doc.setTextColor(...C.grayL);
    doc.text(lbl.toUpperCase()+':', dx, dy);
    doc.setFontSize(7.8); doc.setFont('helvetica','bold'); doc.setTextColor(...C.slateM);
    const maxW=colW-2, trunc=doc.getTextWidth(val)>maxW?val.slice(0,Math.floor(val.length*maxW/doc.getTextWidth(val))-2)+'...':val;
    doc.text(trunc, dx+18, dy);
  });
  y += 50;

  // Score circle
  doc.setFillColor(...(hasCert?[220,252,231]:passedTest?[255,251,235]:[254,226,226]));
  doc.circle(M+22,y+22,22,'F');
  doc.setFillColor(...rClr); doc.circle(M+22,y+22,18,'F');
  doc.setTextColor(...C.white); doc.setFontSize(15); doc.setFont('helvetica','bold');
  const ss=`${score}%`; doc.text(ss, M+22-doc.getTextWidth(ss)/2, y+25);
  doc.setFontSize(5.5);
  const rl=hasCert?'CERT EARNED':passedTest?'PASSED':'NOT PASSED';
  doc.text(rl, M+22-doc.getTextWidth(rl)/2, y+33);

  // Stats
  const sX=M+50, bW=(CW-50)/2-2;
  [['Correct',String(cor),C.green,[240,253,244],[187,247,208]],['Wrong',String(wrg),C.red,[254,242,242],[254,202,202]],['Total Qs',String(tot),C.indigo,[238,242,255],[199,210,254]],['Time',dur,C.amber,[255,251,235],[253,230,138]]]
    .forEach(([lbl,val,clr,bg,brd],i) => {
      const sx=sX+(i%2)*(bW+4), sy=y+Math.floor(i/2)*23;
      doc.setFillColor(...bg); doc.setDrawColor(...brd); doc.setLineWidth(0.5);
      doc.roundedRect(sx,sy,bW,20,3,3,'FD');
      doc.setTextColor(...clr); doc.setFontSize(12); doc.setFont('helvetica','bold');
      doc.text(val, sx+bW/2-doc.getTextWidth(val)/2, sy+10);
      doc.setTextColor(...C.gray); doc.setFontSize(6); doc.setFont('helvetica','normal');
      doc.text(lbl.toUpperCase(), sx+bW/2-doc.getTextWidth(lbl.toUpperCase())/2, sy+16);
    });
  y += 52;

  // Result banner
  const bBg=hasCert?[240,253,244]:passedTest?[255,251,235]:[254,242,242];
  const bBrd=hasCert?[187,247,208]:passedTest?[253,230,138]:[254,202,202];
  doc.setFillColor(...bBg); doc.setDrawColor(...bBrd); doc.setLineWidth(0.8);
  doc.roundedRect(M,y,CW,13,2,2,'FD');
  doc.setTextColor(...rClr); doc.setFontSize(8); doc.setFont('helvetica','bold');
  const bMsg=hasCert?`CERTIFICATE EARNED  —  Score: ${score}%  —  Python ${level} Level`:passedTest?`TEST PASSED  —  Score: ${score}%  —  Need 55% for Certificate  (${55-score}% more needed)`:`NOT PASSED  —  Score: ${score}%  —  Need 40% to Pass, 55% for Certificate`;
  doc.text(bMsg, M+CW/2-doc.getTextWidth(bMsg)/2, y+9);
  y += 18;

  // Divider + heading
  doc.setDrawColor(...C.border); doc.setLineWidth(0.4); doc.line(M,y,W-M,y); y+=7;
  doc.setFillColor(...C.light); doc.setDrawColor(...C.border);
  doc.roundedRect(M,y,CW,11,2,2,'FD');
  doc.setTextColor(...C.indigo); doc.setFontSize(9); doc.setFont('helvetica','bold');
  doc.text('PERFORMANCE ANALYSIS REPORT', M+4, y+7.5);
  doc.setFontSize(7); doc.text('PYSKILL', W-M-16, y+7.5);
  y += 16;

  // Sections
  const sColors=[C.indigo,C.green,C.red,C.amber,C.violet];
  const sBgs=[[238,242,255],[240,253,244],[254,242,242],[255,251,235],[245,243,255]];
  const sBrds=[[199,210,254],[187,247,208],[254,202,202],[253,230,138],[221,214,254]];
  const addPage=(n=30)=>{ if(y+n>H-20){doc.addPage();drawWatermark();y=18;} };

  parseSections(reportText).forEach(({title,body},i) => {
    if(!body) return;
    addPage(35);
    const clr=sColors[i], bg=sBgs[i], brd=sBrds[i];
    doc.setFillColor(...clr); doc.roundedRect(M,y,CW,10,2,2,'F');
    doc.setTextColor(...C.white); doc.setFontSize(8.5); doc.setFont('helvetica','bold');
    doc.text(title, M+4, y+7); y+=13;
    const lines=doc.splitTextToSize(body,CW-8), lineH=5.2, padV=5, boxH=lines.length*lineH+padV*2;
    addPage(boxH+4);
    doc.setFillColor(...bg); doc.setDrawColor(...brd); doc.setLineWidth(0.5);
    doc.roundedRect(M,y,CW,boxH,2,2,'FD');
    let ly=y+padV+4;
    lines.forEach(line => {
      if(line.trim().startsWith('-')){
        doc.setFillColor(...clr); doc.rect(M+4,ly-2.5,2,2,'F');
        doc.setTextColor(...C.slateM); doc.setFontSize(8.8); doc.setFont('helvetica','normal');
        doc.text(line.replace(/^-\s*/,''), M+9, ly);
      } else {
        doc.setTextColor(...C.slateM); doc.setFontSize(8.8); doc.setFont('helvetica','normal');
        doc.text(line, M+4, ly);
      }
      ly+=lineH;
    });
    y+=boxH+6;
  });

  // Footer
  const tp=doc.internal.getNumberOfPages();
  for(let pg=1;pg<=tp;pg++){
    doc.setPage(pg);
    doc.setFillColor(...C.indigoDk); doc.rect(0,H-14,W,14,'F');
    doc.setFillColor(...C.violet);   doc.rect(0,H-14,W,2,'F');
    await drawPyskillLogo(doc, M, H-13, 10, 10);
    doc.setTextColor(...C.indigoL); doc.setFontSize(6.5); doc.setFont('helvetica','normal');
    doc.text('PYSKILL  •  faizupyzone.shop  •  Performance Report', M+13, H-4.5);
    doc.setTextColor(...C.white);
    const pgStr=`${pg} / ${tp}`, pgW=doc.getTextWidth(pgStr);
    doc.text(pgStr, W-M-pgW, H-4.5);
    doc.setFillColor(...C.violet); doc.roundedRect(W-M-pgW-28,H-12,24,7,2,2,'F');
    doc.setTextColor(...C.white); doc.setFontSize(5.5); doc.setFont('helvetica','bold');
    doc.text('VERIFIED', W-M-pgW-24, H-7);
  }
  return doc;
}

// ════════════════════════════════════════════════════════════
// MAIN EXPORT — generateAndSaveReport
// ════════════════════════════════════════════════════════════
export async function generateAndSaveReport(testData, userId) {
  const level    = (testData.level || 'basic').toLowerCase();
  const date     = testData.testDate || new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const n        = (testData.studentInfo?.fullName || 'student').replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'');
  const fileName = `Pyskill_Report_${n}_${level}_${date.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'')}.pdf`;

  // Step 1: Try AI, fallback to manual template
  let reportText = null;
  try { reportText = await fetchAISummary(testData); } catch (_) {}
  if (!reportText || reportText.length < 80) reportText = getManualReport(testData);

  // Step 2: Build PDF
  let pdfBlob;
  try {
    const doc = await buildPDF(testData, reportText);
    pdfBlob   = doc.output('blob');
  } catch (e) {
    console.warn('[Report] PDF build failed:', e?.message);
    return { success: false };
  }

  // Step 3: Upload to Supabase Storage
  let downloadUrl;
  try {
    downloadUrl = await uploadToStorage(userId, level, date, pdfBlob, fileName);
  } catch (e) {
    console.warn('[Report] Supabase Storage upload failed:', e?.message);
    const localUrl = URL.createObjectURL(pdfBlob);
    return { success: true, pdfUrl: localUrl, fileName, savedToCloud: false };
  }

  // Step 4: Save URL to Firestore
  await saveReportUrl(userId, level, date, downloadUrl, fileName);

  return { success: true, pdfUrl: downloadUrl, fileName, savedToCloud: true };
}

// ════════════════════════════════════════════════════════════
// FORCE DOWNLOAD HELPER
// ════════════════════════════════════════════════════════════
async function forceDownload(url, fileName) {
  try {
    const response = await fetch(url);
    const blob     = await response.blob();
    const blobUrl  = URL.createObjectURL(blob);
    const a        = document.createElement('a');
    a.href         = blobUrl;
    a.download     = fileName || 'Pyskill_Report.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (_) {
    // Fallback: open in new tab
    window.open(url, '_blank');
  }
}

// ════════════════════════════════════════════════════════════
// DEFAULT EXPORT — DownloadAIReportButton
// ════════════════════════════════════════════════════════════
export default function DownloadAIReportButton({ isDark, userId, testData, savedReport }) {
  const [status,     setStatus]     = useState('idle');
  const [reportUrl,  setReportUrl]  = useState(savedReport?.pdfUrl || null);
  const [reportName, setReportName] = useState(savedReport?.fileName || null);

  useEffect(() => {
    if (reportUrl) return;
    if (!userId || !testData) return;
    setStatus('checking');
    fetchReportUrl(userId, testData.level, testData.testDate || testData.date)
      .then(data => {
        if (data?.downloadUrl) {
          setReportUrl(data.downloadUrl);
          setReportName(data.fileName);
        }
        setStatus('idle');
      })
      .catch(() => setStatus('idle'));
  }, [userId, testData, reportUrl]);

  const handleDownload = async () => {
    if (status === 'downloading' || status === 'checking') return;

    if (reportUrl) {
      setStatus('downloading');
      try {
        await forceDownload(reportUrl, reportName || 'Pyskill_Report.pdf');
      } finally {
        setTimeout(() => setStatus('idle'), 900);
      }
      return;
    }

    if (!userId || !testData) return;
    setStatus('downloading');
    try {
      const result = await generateAndSaveReport(testData, userId);
      if (result.success) {
        setReportUrl(result.pdfUrl);
        setReportName(result.fileName);
        await forceDownload(result.pdfUrl, result.fileName);
      }
    } catch (_) {}
    setStatus('idle');
  };

  const isChecking    = status === 'checking';
  const isDownloading = status === 'downloading';
  const isBusy        = isChecking || isDownloading;

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={isBusy}
        style={{
          width:'100%', padding:'0.9rem',
          background: isBusy
            ? (isDark ? 'rgba(99,102,241,0.2)' : '#e0e7ff')
            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          border:'none', borderRadius:'12px',
          color: isBusy ? '#6366f1' : '#fff',
          fontSize:'0.92rem', fontWeight:'800',
          cursor: isBusy ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:'0.6rem',
          boxShadow: isBusy ? 'none' : '0 4px 18px rgba(99,102,241,0.4)',
          transition:'all 0.2s', marginBottom:'0.6rem', letterSpacing:'0.02em',
        }}
      >
        {isChecking ? (
          <><span style={{width:16,height:16,border:'2.5px solid #6366f1',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'rptSpin 0.7s linear infinite'}}/>Checking...</>
        ) : isDownloading ? (
          <><span style={{width:16,height:16,border:'2.5px solid #6366f1',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'rptSpin 0.7s linear infinite'}}/>Preparing Download...</>
        ) : (
          <><Brain size={18}/> Download AI Report PDF</>
        )}
      </button>
      <style>{`@keyframes rptSpin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}