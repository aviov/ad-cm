--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Debian 14.17-1.pgdg120+1)
-- Dumped by pg_dump version 14.17 (Debian 14.17-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campaigns (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    "landingPageUrl" text NOT NULL,
    "isRunning" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.campaigns OWNER TO postgres;

--
-- Name: campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.campaigns_id_seq OWNER TO postgres;

--
-- Name: campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.campaigns_id_seq OWNED BY public.campaigns.id;


--
-- Name: countries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.countries (
    id integer NOT NULL,
    code character varying(2) NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.countries OWNER TO postgres;

--
-- Name: countries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.countries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.countries_id_seq OWNER TO postgres;

--
-- Name: countries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.countries_id_seq OWNED BY public.countries.id;


--
-- Name: payouts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payouts (
    id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    budget numeric(10,2),
    "autoStop" boolean DEFAULT false NOT NULL,
    "budgetAlert" boolean DEFAULT false NOT NULL,
    "budgetAlertEmail" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    campaign_id integer,
    country_id integer
);


ALTER TABLE public.payouts OWNER TO postgres;

--
-- Name: payouts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payouts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payouts_id_seq OWNER TO postgres;

--
-- Name: payouts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payouts_id_seq OWNED BY public.payouts.id;


--
-- Name: campaigns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns ALTER COLUMN id SET DEFAULT nextval('public.campaigns_id_seq'::regclass);


--
-- Name: countries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries ALTER COLUMN id SET DEFAULT nextval('public.countries_id_seq'::regclass);


--
-- Name: payouts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payouts ALTER COLUMN id SET DEFAULT nextval('public.payouts_id_seq'::regclass);


--
-- Name: payouts PK_76855dc4f0a6c18c72eea302e87; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT "PK_76855dc4f0a6c18c72eea302e87" PRIMARY KEY (id);


--
-- Name: campaigns PK_831e3fcd4fc45b4e4c3f57a9ee4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT "PK_831e3fcd4fc45b4e4c3f57a9ee4" PRIMARY KEY (id);


--
-- Name: countries PK_b2d7006793e8697ab3ae2deff18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY (id);


--
-- Name: countries UQ_b47cbb5311bad9c9ae17b8c1eda; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT "UQ_b47cbb5311bad9c9ae17b8c1eda" UNIQUE (code);


--
-- Name: payouts FK_4e429f84d570c893957da52c2f7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT "FK_4e429f84d570c893957da52c2f7" FOREIGN KEY (country_id) REFERENCES public.countries(id);


--
-- Name: payouts FK_97c1cfa1041a2ce49fca57d758f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payouts
    ADD CONSTRAINT "FK_97c1cfa1041a2ce49fca57d758f" FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

