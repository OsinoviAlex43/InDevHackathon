--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0 (Postgres.app)
-- Dumped by pg_dump version 17.0 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: trigger_set_timestamp(); Type: FUNCTION; Schema: public; Owner: hotel_user
--

CREATE FUNCTION public.trigger_set_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_set_timestamp() OWNER TO hotel_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.admins (
    id bigint NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(200),
    email character varying(200),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.admins OWNER TO hotel_user;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: hotel_user
--

CREATE SEQUENCE public.admins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO hotel_user;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hotel_user
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: guests; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.guests (
    id bigint NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(200),
    phone character varying(20),
    room_id bigint NOT NULL,
    check_in_date date NOT NULL,
    check_out_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.guests OWNER TO hotel_user;

--
-- Name: guests_id_seq; Type: SEQUENCE; Schema: public; Owner: hotel_user
--

CREATE SEQUENCE public.guests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guests_id_seq OWNER TO hotel_user;

--
-- Name: guests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hotel_user
--

ALTER SEQUENCE public.guests_id_seq OWNED BY public.guests.id;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: hotel_user
--

CREATE TABLE public.rooms (
    id bigint NOT NULL,
    room_number character varying(10) NOT NULL,
    room_type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'free'::character varying NOT NULL,
    price_per_night numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.rooms OWNER TO hotel_user;

--
-- Name: rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: hotel_user
--

CREATE SEQUENCE public.rooms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rooms_id_seq OWNER TO hotel_user;

--
-- Name: rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hotel_user
--

ALTER SEQUENCE public.rooms_id_seq OWNED BY public.rooms.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: guests id; Type: DEFAULT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.guests ALTER COLUMN id SET DEFAULT nextval('public.guests_id_seq'::regclass);


--
-- Name: rooms id; Type: DEFAULT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.rooms ALTER COLUMN id SET DEFAULT nextval('public.rooms_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.admins (id, username, password_hash, full_name, email, created_at, updated_at) FROM stdin;
1	admin	$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdUAp80Z1crSoS1lFqaFS	Администратор Системы	admin@hotel.com	2025-05-16 14:50:31.67604+03	2025-05-16 14:50:31.67604+03
2	manager	$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdUAp80Z1crSoS1lFqaFS	Менеджер Отеля	manager@hotel.com	2025-05-16 14:50:31.67604+03	2025-05-16 14:50:31.67604+03
\.


--
-- Data for Name: guests; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.guests (id, first_name, last_name, email, phone, room_id, check_in_date, check_out_date, created_at, updated_at) FROM stdin;
1	Иван	Иванов	ivanov@mail.ru	+7-999-123-45-67	4	2025-05-14	2025-05-19	2025-05-16 14:50:31.680463+03	2025-05-16 14:50:31.680463+03
2	Анна	Петрова	petrova@mail.ru	+7-999-765-43-21	4	2025-05-15	2025-05-20	2025-05-16 14:50:31.680463+03	2025-05-16 14:50:31.680463+03
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: hotel_user
--

COPY public.rooms (id, room_number, room_type, status, price_per_night, created_at, updated_at) FROM stdin;
1	101	STANDARD	AVAILABLE	100.00	2025-05-16 14:50:31.67948+03	2025-05-16 14:50:31.67948+03
2	102	STANDARD	AVAILABLE	100.00	2025-05-16 14:50:31.67948+03	2025-05-16 14:50:31.67948+03
3	201	DELUXE	AVAILABLE	150.00	2025-05-16 14:50:31.67948+03	2025-05-16 14:50:31.67948+03
4	202	DELUXE	OCCUPIED	150.00	2025-05-16 14:50:31.67948+03	2025-05-16 14:50:31.67948+03
5	301	SUITE	AVAILABLE	250.00	2025-05-16 14:50:31.67948+03	2025-05-16 14:50:31.67948+03
6	302	SUITE	MAINTENANCE	250.00	2025-05-16 14:50:31.67948+03	2025-05-16 14:50:31.67948+03
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hotel_user
--

SELECT pg_catalog.setval('public.admins_id_seq', 3, true);


--
-- Name: guests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hotel_user
--

SELECT pg_catalog.setval('public.guests_id_seq', 2, true);


--
-- Name: rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hotel_user
--

SELECT pg_catalog.setval('public.rooms_id_seq', 6, true);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins admins_username_key; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_key UNIQUE (username);


--
-- Name: guests guests_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.guests
    ADD CONSTRAINT guests_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_room_number_key; Type: CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_room_number_key UNIQUE (room_number);


--
-- Name: admins trg_admins_updated; Type: TRIGGER; Schema: public; Owner: hotel_user
--

CREATE TRIGGER trg_admins_updated BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- Name: guests trg_guests_updated; Type: TRIGGER; Schema: public; Owner: hotel_user
--

CREATE TRIGGER trg_guests_updated BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- Name: rooms trg_rooms_updated; Type: TRIGGER; Schema: public; Owner: hotel_user
--

CREATE TRIGGER trg_rooms_updated BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


--
-- Name: guests guests_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hotel_user
--

ALTER TABLE ONLY public.guests
    ADD CONSTRAINT guests_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

