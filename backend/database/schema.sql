--
-- PostgreSQL database dump
--

\restrict dcXQoHldmWVP4fPqC3UkB1a3EFFCrG0tp4eB7oyRgBx2hUo5UNHBXGqfrJ5utuP

-- Dumped from database version 18.7 (a21afb5)
-- Dumped by pg_dump version 18.6

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campaigns (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    category character varying(100) NOT NULL,
    goal numeric(12,2) NOT NULL,
    amount_raised numeric(12,2) DEFAULT 0 NOT NULL,
    deadline date NOT NULL,
    image text,
    creator_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT campaigns_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);
ALTER TABLE ONLY public.campaigns ALTER COLUMN id SET (pg_attver=28774880);
ALTER TABLE ONLY public.campaigns ALTER COLUMN title SET (pg_attver=28774880);
ALTER TABLE ONLY public.campaigns ALTER COLUMN description SET (pg_attver=28774880);
ALTER TABLE ONLY public.campaigns ALTER COLUMN category SET (pg_attver=28774880);
ALTER TABLE ONLY public.campaigns ALTER COLUMN goal SET (pg_attver=28774880);
ALTER TABLE ONLY public.campaigns ALTER COLUMN amount_raised SET (pg_attver=28774880);
ALTER TABLE ONLY public.campaigns ALTER COLUMN deadline SET (pg_attver=28774880);
ALTER TABLE ONLY public.campaigns ALTER COLUMN image SET (pg_attver=28774880);
ALTER TABLE ONLY public.campaigns ALTER COLUMN creator_id SET (pg_attver=28774880);
ALTER TABLE ONLY public.campaigns ALTER COLUMN status SET (pg_attver=28774880);
ALTER TABLE ONLY public.campaigns ALTER COLUMN created_at SET (pg_attver=28774880);
ALTER TABLE ONLY public.campaigns ALTER COLUMN updated_at SET (pg_attver=28774880);


--
-- Name: campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.campaigns_id_seq OWNED BY public.campaigns.id;


--
-- Name: contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contributions (
    id integer NOT NULL,
    supporter_id integer NOT NULL,
    campaign_id integer NOT NULL,
    amount numeric(12,2) NOT NULL,
    utr_reference character varying(100),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT contributions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'successful'::character varying, 'failed'::character varying])::text[])))
);
ALTER TABLE ONLY public.contributions ALTER COLUMN id SET (pg_attver=28818856);
ALTER TABLE ONLY public.contributions ALTER COLUMN supporter_id SET (pg_attver=28818856);
ALTER TABLE ONLY public.contributions ALTER COLUMN campaign_id SET (pg_attver=28818856);
ALTER TABLE ONLY public.contributions ALTER COLUMN amount SET (pg_attver=28818856);
ALTER TABLE ONLY public.contributions ALTER COLUMN utr_reference SET (pg_attver=28818856);
ALTER TABLE ONLY public.contributions ALTER COLUMN status SET (pg_attver=28818856);
ALTER TABLE ONLY public.contributions ALTER COLUMN created_at SET (pg_attver=28818856);
ALTER TABLE ONLY public.contributions ALTER COLUMN updated_at SET (pg_attver=28818856);


--
-- Name: contributions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contributions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contributions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contributions_id_seq OWNED BY public.contributions.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash character varying(64) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
ALTER TABLE ONLY public.sessions ALTER COLUMN id SET (pg_attver=28747176);
ALTER TABLE ONLY public.sessions ALTER COLUMN user_id SET (pg_attver=28747176);
ALTER TABLE ONLY public.sessions ALTER COLUMN token_hash SET (pg_attver=28747176);
ALTER TABLE ONLY public.sessions ALTER COLUMN expires_at SET (pg_attver=28747176);
ALTER TABLE ONLY public.sessions ALTER COLUMN created_at SET (pg_attver=28747176);


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    upi_id character varying(100),
    upi_qr_image text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying])::text[])))
);
ALTER TABLE ONLY public.users ALTER COLUMN id SET (pg_attver=28711304);
ALTER TABLE ONLY public.users ALTER COLUMN name SET (pg_attver=28711304);
ALTER TABLE ONLY public.users ALTER COLUMN email SET (pg_attver=28711304);
ALTER TABLE ONLY public.users ALTER COLUMN password_hash SET (pg_attver=28711304);
ALTER TABLE ONLY public.users ALTER COLUMN role SET (pg_attver=28711304);
ALTER TABLE ONLY public.users ALTER COLUMN upi_id SET (pg_attver=28711304);
ALTER TABLE ONLY public.users ALTER COLUMN upi_qr_image SET (pg_attver=28711304);
ALTER TABLE ONLY public.users ALTER COLUMN created_at SET (pg_attver=28711304);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: campaigns id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns ALTER COLUMN id SET DEFAULT nextval('public.campaigns_id_seq'::regclass);


--
-- Name: contributions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions ALTER COLUMN id SET DEFAULT nextval('public.contributions_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: contributions contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_hash_key UNIQUE (token_hash);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_campaigns_creator_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_creator_id ON public.campaigns USING btree (creator_id);


--
-- Name: idx_campaigns_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_campaigns_status ON public.campaigns USING btree (status);


--
-- Name: idx_contributions_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contributions_campaign_id ON public.contributions USING btree (campaign_id);


--
-- Name: idx_contributions_supporter_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contributions_supporter_id ON public.contributions USING btree (supporter_id);


--
-- Name: idx_contributions_utr_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_contributions_utr_unique ON public.contributions USING btree (utr_reference) WHERE (utr_reference IS NOT NULL);


--
-- Name: idx_sessions_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: campaigns campaigns_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id);


--
-- Name: contributions contributions_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);


--
-- Name: contributions contributions_supporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_supporter_id_fkey FOREIGN KEY (supporter_id) REFERENCES public.users(id);


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict dcXQoHldmWVP4fPqC3UkB1a3EFFCrG0tp4eB7oyRgBx2hUo5UNHBXGqfrJ5utuP

